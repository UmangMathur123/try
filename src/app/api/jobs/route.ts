import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSession } from '@/lib/auth';
import { calculateResumeMatchScore } from '@/lib/scoring';

// GET - list jobs (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const search = searchParams.get('search');

    const where: any = { status: 'ACTIVE' };
    if (companyId) where.companyId = companyId;

    const jobs = await prisma.job.findMany({
      where,
      include: {
        company: { include: { user: { select: { name: true } } } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    let filtered = jobs;
    if (search) {
      const s = search.toLowerCase();
      filtered = jobs.filter(
        (j: any) =>
          j.title.toLowerCase().includes(s) ||
          j.description.toLowerCase().includes(s) ||
          j.requiredSkills.toLowerCase().includes(s)
      );
    }

    return NextResponse.json({ jobs: filtered });
  } catch (error) {
    console.error('Get jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

// POST - create job
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = parseSession(token);
    if (!session || session.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Only companies can create jobs' }, { status: 403 });
    }

    const company = await prisma.companyProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!company) return NextResponse.json({ error: 'Company profile not found' }, { status: 404 });

    const body = await request.json();
    const { title, description, requiredSkills, experienceMin, experienceMax } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description required' }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        title,
        description,
        requiredSkills: requiredSkills || '',
        experienceMin: experienceMin || 0,
        experienceMax: experienceMax || 10,
      },
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
