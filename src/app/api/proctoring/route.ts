import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { interviewId, type, details } = body;

    if (!interviewId || !type) {
      return NextResponse.json({ error: 'Interview ID and type required' }, { status: 400 });
    }

    const flag = await prisma.proctoringFlag.create({
      data: {
        interviewId,
        type,
        details: details || null,
      },
    });

    // Count total flags for this interview
    const flagCount = await prisma.proctoringFlag.count({
      where: { interviewId },
    });

    return NextResponse.json({ flag, totalFlags: flagCount, integrityScore: Math.max(0, 100 - flagCount * 5) });
  } catch (error) {
    console.error('Proctoring error:', error);
    return NextResponse.json({ error: 'Failed to log flag' }, { status: 500 });
  }
}
