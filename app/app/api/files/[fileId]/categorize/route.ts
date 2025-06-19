
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { categorizationEngine } from '@/lib/categorization';
import { FileCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    const { category } = await request.json();

    if (!Object.values(FileCategory).includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Get the current file
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const oldCategory = file.category;

    // Update the file category
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        category: category as FileCategory,
        isManuallySet: true,
        confidence: 1.0, // Manual categorization has 100% confidence
      },
    });

    // Record the categorization history
    await prisma.categorizationHistory.create({
      data: {
        fileId: file.fileId,
        oldCategory: oldCategory as FileCategory,
        newCategory: category as FileCategory,
        confidence: 1.0,
        isManual: true,
        reason: 'Manual categorization by user',
      },
    });

    // Learn from the correction
    await categorizationEngine.learnFromCorrection(
      file.name,
      file.parentPath,
      file.mimeType,
      oldCategory as FileCategory,
      category as FileCategory
    );

    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: 'FILE_RECATEGORIZED',
        description: `File "${file.name}" recategorized from ${oldCategory} to ${category}`,
        metadata: {
          fileId: file.id,
          fileName: file.name,
          oldCategory,
          newCategory: category,
        },
      },
    });

    return NextResponse.json({
      ...updatedFile,
      size: updatedFile.size.toString(),
    });
  } catch (error) {
    console.error('Error updating file category:', error);
    return NextResponse.json(
      { error: 'Failed to update file category' },
      { status: 500 }
    );
  }
}
