
import { NextRequest, NextResponse } from 'next/server';
import { graphService } from '@/lib/microsoft-graph';
import { categorizationEngine } from '@/lib/categorization';
import { prisma } from '@/lib/db';
import { FileCategory, FileStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Create a new scan session
    const scanSession = await prisma.scanSession.create({
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    // Start the scanning process in the background
    scanFilesInBackground(scanSession.id);

    return NextResponse.json({ 
      sessionId: scanSession.id,
      status: 'RUNNING',
      message: 'File scanning started'
    });
  } catch (error) {
    console.error('Error starting scan:', error);
    return NextResponse.json(
      { error: 'Failed to start scan' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific scan session status
      const session = await prisma.scanSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        return NextResponse.json(
          { error: 'Scan session not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(session);
    } else {
      // Get latest scan session
      const latestSession = await prisma.scanSession.findFirst({
        orderBy: { startedAt: 'desc' },
      });

      return NextResponse.json(latestSession);
    }
  } catch (error) {
    console.error('Error fetching scan status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan status' },
      { status: 500 }
    );
  }
}

async function scanFilesInBackground(sessionId: string) {
  try {
    let totalFilesFound = 0;
    let totalFilesProcessed = 0;
    const errors: string[] = [];

    // Get all teams
    const teams = await prisma.team.findMany();
    
    for (const team of teams) {
      try {
        // Get channels for this team
        const channels = await prisma.channel.findMany({
          where: { teamId: team.id },
        });

        for (const channel of channels) {
          try {
            // Scan files in this channel
            const microsoftFiles = await graphService.getChannelFiles(
              team.teamId,
              channel.channelId
            );

            totalFilesFound += microsoftFiles.length;

            // Process each file
            for (const msFile of microsoftFiles) {
              try {
                // Categorize the file
                const categorization = categorizationEngine.categorizeFile(
                  msFile.name,
                  msFile.parentReference.path,
                  msFile.file?.mimeType || 'application/octet-stream'
                );

                // Get file extension
                const extension = msFile.name.includes('.') 
                  ? msFile.name.substring(msFile.name.lastIndexOf('.'))
                  : null;

                // Store file in database
                await prisma.file.upsert({
                  where: { fileId: msFile.id },
                  update: {
                    name: msFile.name,
                    size: BigInt(msFile.size),
                    mimeType: msFile.file?.mimeType || 'application/octet-stream',
                    extension,
                    webUrl: msFile.webUrl,
                    downloadUrl: msFile.downloadUrl,
                    parentPath: msFile.parentReference.path,
                    relativePath: msFile.parentReference.path,
                    category: categorization.category as FileCategory,
                    confidence: categorization.confidence,
                    status: FileStatus.CATEGORIZED,
                    modifiedAt: new Date(msFile.lastModifiedDateTime),
                    lastScannedAt: new Date(),
                    teamId: team.id,
                    channelId: channel.id,
                  },
                  create: {
                    fileId: msFile.id,
                    name: msFile.name,
                    size: BigInt(msFile.size),
                    mimeType: msFile.file?.mimeType || 'application/octet-stream',
                    extension,
                    webUrl: msFile.webUrl,
                    downloadUrl: msFile.downloadUrl,
                    parentPath: msFile.parentReference.path,
                    relativePath: msFile.parentReference.path,
                    category: categorization.category as FileCategory,
                    confidence: categorization.confidence,
                    status: FileStatus.CATEGORIZED,
                    modifiedAt: new Date(msFile.lastModifiedDateTime),
                    lastScannedAt: new Date(),
                    teamId: team.id,
                    channelId: channel.id,
                  },
                });

                // Store categorization history
                await prisma.categorizationHistory.create({
                  data: {
                    fileId: msFile.id,
                    newCategory: categorization.category as FileCategory,
                    confidence: categorization.confidence,
                    reason: categorization.reason,
                  },
                });

                totalFilesProcessed++;

                // Update scan session progress
                await prisma.scanSession.update({
                  where: { id: sessionId },
                  data: {
                    filesFound: totalFilesFound,
                    filesProcessed: totalFilesProcessed,
                  },
                });

              } catch (fileError) {
                console.error(`Error processing file ${msFile.name}:`, fileError);
                errors.push(`Error processing file ${msFile.name}: ${fileError}`);
              }
            }

          } catch (channelError) {
            console.error(`Error scanning channel ${channel.displayName}:`, channelError);
            errors.push(`Error scanning channel ${channel.displayName}: ${channelError}`);
          }
        }

      } catch (teamError) {
        console.error(`Error scanning team ${team.displayName}:`, teamError);
        errors.push(`Error scanning team ${team.displayName}: ${teamError}`);
      }
    }

    // Complete the scan session
    await prisma.scanSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        filesFound: totalFilesFound,
        filesProcessed: totalFilesProcessed,
        errors: errors.length > 0 ? errors : undefined,
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: 'SCAN_COMPLETED',
        description: `Scan completed: ${totalFilesProcessed}/${totalFilesFound} files processed`,
        metadata: {
          sessionId,
          filesFound: totalFilesFound,
          filesProcessed: totalFilesProcessed,
          errors: errors.length,
        },
      },
    });

  } catch (error) {
    console.error('Error in background scan:', error);
    
    // Mark scan as failed
    await prisma.scanSession.update({
      where: { id: sessionId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      },
    });
  }
}
