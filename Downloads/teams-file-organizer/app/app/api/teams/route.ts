
import { NextRequest, NextResponse } from 'next/server';
import { graphService } from '@/lib/microsoft-graph';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch teams from Microsoft Graph
    const microsoftTeams = await graphService.getTeams();
    
    // Store/update teams in database
    const teams = [];
    for (const msTeam of microsoftTeams) {
      const team = await prisma.team.upsert({
        where: { teamId: msTeam.id },
        update: {
          displayName: msTeam.displayName,
          description: msTeam.description,
          webUrl: msTeam.webUrl,
          updatedAt: new Date(),
        },
        create: {
          teamId: msTeam.id,
          displayName: msTeam.displayName,
          description: msTeam.description,
          webUrl: msTeam.webUrl,
        },
      });
      teams.push(team);
    }

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}
