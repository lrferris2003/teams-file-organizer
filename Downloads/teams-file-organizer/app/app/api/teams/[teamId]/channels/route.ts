
import { NextRequest, NextResponse } from 'next/server';
import { graphService } from '@/lib/microsoft-graph';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params;
    
    // Find the team in our database
    const team = await prisma.team.findUnique({
      where: { teamId },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Fetch channels from Microsoft Graph
    const microsoftChannels = await graphService.getChannels(teamId);
    
    // Store/update channels in database
    const channels = [];
    for (const msChannel of microsoftChannels) {
      const channel = await prisma.channel.upsert({
        where: { channelId: msChannel.id },
        update: {
          displayName: msChannel.displayName,
          description: msChannel.description,
          webUrl: msChannel.webUrl,
          updatedAt: new Date(),
        },
        create: {
          channelId: msChannel.id,
          displayName: msChannel.displayName,
          description: msChannel.description,
          webUrl: msChannel.webUrl,
          teamId: team.id,
        },
      });
      channels.push(channel);
    }

    return NextResponse.json({ channels });
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}
