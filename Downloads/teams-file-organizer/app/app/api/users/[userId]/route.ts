
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { UserRole, Department } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Get specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        fileActions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            file: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
        categorizations: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            file: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            fileActions: true,
            categorizations: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

// Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { name, role, department, isActive } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(role && { role: role as UserRole }),
        ...(department && { department: department as Department }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: 'USER_UPDATED',
        description: `User updated: ${updatedUser.name} (${updatedUser.email})`,
        metadata: {
          userId: updatedUser.id,
          changes: { name, role, department, isActive },
        },
      },
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: 'USER_DELETED',
        description: `User deleted: ${user.name} (${user.email})`,
        metadata: {
          userId: user.id,
          email: user.email,
        },
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
