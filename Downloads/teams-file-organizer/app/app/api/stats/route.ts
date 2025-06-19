import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { FileCategory, FileStatus, Department } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get total files count
    const totalFiles = await prisma.file.count();

    // Get categorized files count (not UNCATEGORIZED)
    const categorizedFiles = await prisma.file.count({
      where: {
        category: {
          not: FileCategory.UNCATEGORIZED,
        },
      },
    });

    // Get organized files count
    const organizedFiles = await prisma.file.count({
      where: {
        status: FileStatus.ORGANIZED,
      },
    });

    // Get AI analyzed files count
    const aiAnalyzedFiles = await prisma.fileContentAnalysis.count();

    // Get manual categorizations count
    const manualCategorizations = await prisma.manualCategorization.count();

    // Get files by category
    const categoryStats = await prisma.file.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    const filesByCategory = categoryStats.reduce(
      (acc: Record<string, number>, stat: any) => {
        acc[stat.category] = stat._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Ensure all categories are represented
    Object.values(FileCategory).forEach(category => {
      if (!(category in filesByCategory)) {
        filesByCategory[category] = 0;
      }
    });

    // Get files by department (mapping categories to departments)
    const departmentMapping: Record<FileCategory, Department> = {
      [FileCategory.OPERATIONS]: Department.OPERATIONS,
      [FileCategory.ESTIMATING]: Department.ESTIMATING,
      [FileCategory.ACCOUNTING]: Department.ACCOUNTING,
      [FileCategory.FINANCE]: Department.FINANCE,
      [FileCategory.OFFICE]: Department.OFFICE,
      [FileCategory.COMPANY_LAYOUT]: Department.COMPANY_LAYOUT,
      [FileCategory.UNCATEGORIZED]: Department.ALL_DEPARTMENTS,
    };

    const filesByDepartment: Record<string, number> = {};
    Object.values(Department).forEach(dept => {
      filesByDepartment[dept] = 0;
    });

    categoryStats.forEach((stat: any) => {
      const department = departmentMapping[stat.category as FileCategory];
      if (department) {
        filesByDepartment[department] += stat._count.id;
      }
    });

    // Get last scan date from the most recent scan session
    const lastScan = await prisma.scanSession.findFirst({
      where: {
        status: 'COMPLETED',
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    // Get team statistics
    const teamStats = await prisma.team.findMany({
      select: {
        id: true,
        displayName: true,
        _count: {
          select: {
            files: true,
            channels: true,
          },
        },
      },
      orderBy: {
        displayName: 'asc',
      },
    });

    // Get recent activity
    const recentActivity = await prisma.activityLog.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        action: true,
        description: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      totalFiles,
      categorizedFiles,
      organizedFiles,
      aiAnalyzedFiles,
      manualCategorizations,
      filesByCategory,
      filesByDepartment,
      lastScanDate: lastScan?.completedAt?.toISOString(),
      teamStats,
      recentActivity: recentActivity.map((activity: any) => ({
        ...activity,
        createdAt: activity.createdAt.toISOString(),
      })),
    });

  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch statistics' }, 
      { status: 500 }
    );
  }
}