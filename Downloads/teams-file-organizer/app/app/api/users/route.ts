
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { UserRole, Department } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Get all users
export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            fileActions: true,
            categorizations: true,
          },
        },
      },
    });

    return NextResponse.json(users);

  } catch (error) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}

// Create new user
export async function POST(request: NextRequest) {
  try {
    const { email, name, role, department } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: role || UserRole.USER,
        department: department || Department.ALL_DEPARTMENTS,
      },
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        action: 'USER_CREATED',
        description: `New user created: ${name} (${email})`,
        metadata: {
          userId: user.id,
          email,
          role: user.role,
          department: user.department,
        },
      },
    });

    return NextResponse.json(user);

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
