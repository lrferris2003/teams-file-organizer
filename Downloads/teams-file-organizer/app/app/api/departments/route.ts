
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Department, FileCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Get department analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') as Department;

    if (department && department !== 'ALL_DEPARTMENTS') {
      // Get analytics for specific department
      const categoryMap: Record<Department, FileCategory> = {
        OPERATIONS: FileCategory.OPERATIONS,
        ESTIMATING: FileCategory.ESTIMATING,
        ACCOUNTING: FileCategory.ACCOUNTING,
        FINANCE: FileCategory.FINANCE,
        OFFICE: FileCategory.OFFICE,
        COMPANY_LAYOUT: FileCategory.COMPANY_LAYOUT,
        ALL_DEPARTMENTS: FileCategory.UNCATEGORIZED, // This won't be used
      };

      const category = categoryMap[department];
      
      const files = await prisma.file.findMany({
        where: { category },
        include: {
          contentAnalysis: true,
          categorizations: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      const departmentKeywords = await prisma.departmentKeyword.findMany({
        where: { department, isActive: true },
        orderBy: { weight: 'desc' },
        take: 20,
      });

      const recentActivity = await prisma.activityLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
          description: {
            contains: category,
          },
        },
      });

      return NextResponse.json({
        department,
        totalFiles: files.length,
        categorizedFiles: files.filter((f: any) => f.category !== FileCategory.UNCATEGORIZED).length,
        recentActivity,
        topKeywords: departmentKeywords.map((k: any) => k.keyword),
        files: files.map((file: any) => ({
          ...file,
          size: file.size.toString(),
        })),
        categoryDistribution: {
          [category]: files.length,
        },
      });
    }

    // Get analytics for all departments
    const allDepartments = Object.values(Department).filter(d => d !== 'ALL_DEPARTMENTS');
    const analytics = [];

    for (const dept of allDepartments) {
      const categoryMap: Record<Department, FileCategory> = {
        OPERATIONS: FileCategory.OPERATIONS,
        ESTIMATING: FileCategory.ESTIMATING,
        ACCOUNTING: FileCategory.ACCOUNTING,
        FINANCE: FileCategory.FINANCE,
        OFFICE: FileCategory.OFFICE,
        COMPANY_LAYOUT: FileCategory.COMPANY_LAYOUT,
        ALL_DEPARTMENTS: FileCategory.UNCATEGORIZED,
      };

      const category = categoryMap[dept];
      
      const fileCount = await prisma.file.count({
        where: { category },
      });

      const categorizedCount = await prisma.file.count({
        where: { 
          category,
          status: 'CATEGORIZED',
        },
      });

      const recentActivity = await prisma.activityLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          description: {
            contains: category,
          },
        },
      });

      const topKeywords = await prisma.departmentKeyword.findMany({
        where: { department: dept, isActive: true },
        orderBy: { weight: 'desc' },
        take: 5,
      });

      analytics.push({
        department: dept,
        totalFiles: fileCount,
        categorizedFiles: categorizedCount,
        recentActivity,
        topKeywords: topKeywords.map((k: any) => k.keyword),
        categoryDistribution: {
          [category]: fileCount,
        },
      });
    }

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error getting department analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get department analytics' },
      { status: 500 }
    );
  }
}

// Update department keywords
export async function POST(request: NextRequest) {
  try {
    const { department, keywords } = await request.json();

    if (!department || !keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { error: 'Department and keywords array are required' },
        { status: 400 }
      );
    }

    // Deactivate existing keywords for this department
    await prisma.departmentKeyword.updateMany({
      where: { department },
      data: { isActive: false },
    });

    // Add new keywords
    const keywordRecords = keywords.map((keyword: any) => ({
      keyword: keyword.keyword || keyword,
      department,
      weight: keyword.weight || 1.0,
      source: keyword.source || 'manual',
      isActive: true,
    }));

    await prisma.departmentKeyword.createMany({
      data: keywordRecords,
      skipDuplicates: true,
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: 'DEPARTMENT_KEYWORDS_UPDATED',
        description: `Keywords updated for ${department}`,
        metadata: {
          department,
          keywordCount: keywords.length,
        },
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating department keywords:', error);
    return NextResponse.json(
      { error: 'Failed to update department keywords' },
      { status: 500 }
    );
  }
}
