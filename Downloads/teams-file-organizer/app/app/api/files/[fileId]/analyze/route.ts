
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { categorizationEngine } from '@/lib/categorization';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    // Get the file from database
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Create content analysis job
    const analysisJob = await prisma.contentAnalysisJob.create({
      data: {
        fileId: file.id,
        status: 'PROCESSING',
        jobType: 'FULL_ANALYSIS',
      },
    });

    try {
      // Extract file content if download URL is available
      let fileContent: string | null = null;
      if (file.downloadUrl) {
        fileContent = await categorizationEngine.extractFileContent(
          file.downloadUrl,
          file.mimeType,
          file.name
        );
      }

      // Perform AI-powered categorization
      const aiResult = await categorizationEngine.categorizeFileWithAI(
        file.name,
        file.parentPath,
        file.mimeType,
        fileContent || undefined
      );

      // Store content analysis results
      const contentAnalysis = await prisma.fileContentAnalysis.upsert({
        where: { fileId: file.id },
        update: {
          extractedText: fileContent?.substring(0, 5000),
          summary: aiResult.summary,
          keywords: aiResult.keywords,
          entities: aiResult.entities as any,
          contentType: file.mimeType,
          confidence: aiResult.confidence,
          aiModel: 'gpt-4.1-mini',
          analyzedAt: new Date(),
        },
        create: {
          fileId: file.id,
          extractedText: fileContent?.substring(0, 5000),
          summary: aiResult.summary,
          keywords: aiResult.keywords,
          entities: aiResult.entities as any,
          contentType: file.mimeType,
          confidence: aiResult.confidence,
          aiModel: 'gpt-4.1-mini',
        },
      });

      // Update file with AI categorization if confidence is high enough
      if (aiResult.confidence > 0.6 && !file.isManuallySet) {
        await prisma.file.update({
          where: { id: fileId },
          data: {
            category: aiResult.category,
            confidence: aiResult.confidence,
            status: 'CATEGORIZED',
          },
        });

        // Record categorization history
        await prisma.categorizationHistory.create({
          data: {
            fileId: file.id,
            oldCategory: file.category,
            newCategory: aiResult.category,
            confidence: aiResult.confidence,
            isManual: false,
            reason: aiResult.reason,
          },
        });
      }

      // Update analysis job as completed
      await prisma.contentAnalysisJob.update({
        where: { id: analysisJob.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          result: {
            category: aiResult.category,
            confidence: aiResult.confidence,
            reason: aiResult.reason,
            keywords: aiResult.keywords,
            summary: aiResult.summary,
          },
        },
      });

      // Log the activity
      await prisma.activityLog.create({
        data: {
          action: 'FILE_AI_ANALYZED',
          description: `AI analysis completed for "${file.name}"`,
          metadata: {
            fileId: file.id,
            fileName: file.name,
            category: aiResult.category,
            confidence: aiResult.confidence,
            keywordsFound: aiResult.keywords.length,
          },
        },
      });

      return NextResponse.json({
        success: true,
        analysis: contentAnalysis,
        categorization: aiResult,
        jobId: analysisJob.id,
      });

    } catch (error) {
      // Update analysis job as failed
      await prisma.contentAnalysisJob.update({
        where: { id: analysisJob.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }

  } catch (error) {
    console.error('Error analyzing file:', error);
    return NextResponse.json(
      { error: 'Failed to analyze file' },
      { status: 500 }
    );
  }
}

// Get analysis results
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        contentAnalysis: true,
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      file: {
        ...file,
        size: file.size.toString(),
      },
      contentAnalysis: file.contentAnalysis,
    });

  } catch (error) {
    console.error('Error getting file analysis:', error);
    return NextResponse.json(
      { error: 'Failed to get file analysis' },
      { status: 500 }
    );
  }
}
