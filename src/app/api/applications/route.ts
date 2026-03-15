import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSession } from '@/lib/auth';
import { calculateResumeMatchScore } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = parseSession(token);
    if (!session || session.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Only candidates can apply' }, { status: 403 });
    }

    const candidate = await prisma.candidateProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!candidate) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const body = await request.json();
    const { jobId } = body;

    if (!jobId) return NextResponse.json({ error: 'Job ID required' }, { status: 400 });

    // Check if already applied
    const existing = await prisma.application.findFirst({
      where: { candidateId: candidate.id, jobId },
    });
    if (existing) {
      return NextResponse.json({ error: 'Already applied to this job' }, { status: 409 });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    // Calculate resume match score
    const candidateSkills = candidate.skills.split(',').filter(Boolean);
    const requiredSkills = job.requiredSkills.split(',').filter(Boolean);
    const resumeMatchScore = calculateResumeMatchScore(candidateSkills, requiredSkills);

    const application = await prisma.application.create({
      data: {
        candidateId: candidate.id,
        jobId,
        resumeMatchScore,
        status: 'APPLIED',
      },
    });

    return NextResponse.json({ application, resumeMatchScore });
  } catch (error) {
    console.error('Apply error:', error);
    return NextResponse.json({ error: 'Failed to apply' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = parseSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (session.role === 'CANDIDATE') {
      const candidate = await prisma.candidateProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!candidate) return NextResponse.json({ applications: [] });

      const applications = await prisma.application.findMany({
        where: { candidateId: candidate.id },
        include: {
          job: { include: { company: { include: { user: { select: { name: true } } } } } },
          interview: true,
        },
        orderBy: { appliedAt: 'desc' },
      });

      return NextResponse.json({ applications });
    }

    if (session.role === 'COMPANY') {
      const { searchParams } = new URL(request.url);
      const jobId = searchParams.get('jobId');

      const company = await prisma.companyProfile.findUnique({
        where: { userId: session.userId },
      });
      if (!company) return NextResponse.json({ applications: [] });

      const where: any = {};
      if (jobId) {
        where.jobId = jobId;
      } else {
        where.job = { companyId: company.id };
      }

      const applications = await prisma.application.findMany({
        where,
        include: {
          candidate: { include: { user: { select: { name: true, email: true } } } },
          job: true,
          interview: true,
        },
        orderBy: { appliedAt: 'desc' },
      });

      return NextResponse.json({ applications });
    }

    return NextResponse.json({ applications: [] });
  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
