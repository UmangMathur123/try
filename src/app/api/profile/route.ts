import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSession } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = parseSession(token);
    if (!session || session.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { skills, cgpa, experience, education, aadhaarNumber, panNumber } = body;

    const updateData: any = {};
    if (skills !== undefined) updateData.skills = skills;
    if (cgpa !== undefined) updateData.cgpa = parseFloat(cgpa) || null;
    if (experience !== undefined) updateData.experience = parseInt(experience) || 0;
    if (education !== undefined) updateData.education = education;

    // Simulated verification
    if (aadhaarNumber !== undefined) {
      updateData.aadhaarNumber = aadhaarNumber;
      updateData.aadhaarVerified = /^\d{12}$/.test(aadhaarNumber.replace(/\s/g, ''));
    }
    if (panNumber !== undefined) {
      updateData.panNumber = panNumber;
      updateData.panVerified = /^[A-Z]{5}\d{4}[A-Z]$/.test(panNumber.toUpperCase());
    }

    const profile = await prisma.candidateProfile.update({
      where: { userId: session.userId },
      data: updateData,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = parseSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { candidateProfile: true, companyProfile: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
