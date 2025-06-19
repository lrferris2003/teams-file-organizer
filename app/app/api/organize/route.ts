
import { NextRequest, NextResponse } from 'next/server';
import { graphService } from '@/lib/microsoft-graph';
import { prisma } from '@/lib/db';
import { FileCategory, FileStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { fileIds, targetTeamId } = await request.json();

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: 'File IDs are required' },
        { status: 400 }
      );
    }

    if (!targetTeamId) {
      return NextResponse.json(
        { error: 'Target team ID is required' },
        { status: 400 }
      );
    }

    // Get the target team
    const targetTeam = await prisma.team.findUnique({
      where: { id: targetTeamId },
    });

    if (!targetTeam) {
      return NextResponse.json(
        { error: 'Target team not found' },
        { status: 404 }
      );
    }

    // Get the team's drive
    const { driveId, rootFolderId } = await graphService.getTeamDrive(targetTeam.teamId);

    const results = [];
    const errors = [];

    // Process each file
    for (const fileId of fileIds) {
      try {
        const file = await prisma.file.findUnique({
          where: { id: fileId },
        });

        if (!file) {
          errors.push(`File with ID ${fileId} not found`);
          continue;
        }

        // Create category folder if it doesn't exist
        const categoryFolderName = `Organized_${file.category}`;
        let categoryFolderId: string;

        try {
          categoryFolderId = await graphService.createFolder(
            driveId,
            rootFolderId,
            categoryFolderName
          );
        } catch (error) {
          // Folder might already exist, try to find it
          // For now, we'll use the root folder
          categoryFolderId = rootFolderId;
        }

        // Copy the file to the organized location
        await graphService.copyFile(
          driveId,
          file.fileId,
          categoryFolderId,
          file.name
        );

        // Update file status
        const organizedPath = `/${categoryFolderName}/${file.name}`;
        await prisma.file.update({
          where: { id: fileId },
          data: {
            status: FileStatus.ORGANIZED,
            organizedPath,
            organizedAt: new Date(),
          },
        });

        results.push({
          fileId,
          fileName: file.name,
          organizedPath,
          status: 'success',
        });

        // Log the activity
        await prisma.activityLog.create({
          data: {
            action: 'FILE_ORGANIZED',
            description: `File "${file.name}" organized to ${organizedPath}`,
            metadata: {
              fileId: file.id,
              fileName: file.name,
              category: file.category,
              organizedPath,
              targetTeam: targetTeam.displayName,
            },
          },
        });

      } catch (error) {
        console.error(`Error organizing file ${fileId}:`, error);
        errors.push(`Error organizing file ${fileId}: ${error}`);
      }
    }

    return NextResponse.json({
      results,
      errors,
      summary: {
        total: fileIds.length,
        successful: results.length,
        failed: errors.length,
      },
    });
  } catch (error) {
    console.error('Error organizing files:', error);
    return NextResponse.json(
      { error: 'Failed to organize files' },
      { status: 500 }
    );
  }
}
