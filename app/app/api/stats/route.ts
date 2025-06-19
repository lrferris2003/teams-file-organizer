import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Replace with your real logic as needed!
    const categoryStats: any[] = [
      // { category: 'Finance', _count: { id: 3 } }
    ];

    // Typed the reduce's acc parameter and initial value
    const filesByCategory = categoryStats.reduce(
      (acc: Record<string, number>, stat: any) => {
        acc[stat.category] = stat._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({ stats: filesByCategory }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}