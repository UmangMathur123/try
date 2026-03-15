import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, phone, companyName, industry, skills, cgpa, experience, education } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        phone: phone || null,
      },
    });

    if (role === 'CANDIDATE') {
      await prisma.candidateProfile.create({
        data: {
          userId: user.id,
          skills: skills || '',
          cgpa: cgpa ? parseFloat(cgpa) : null,
          experience: experience ? parseInt(experience) : 0,
          education: education || null,
        },
      });
    } else if (role === 'COMPANY') {
      await prisma.companyProfile.create({
        data: {
          userId: user.id,
          companyName: companyName || name,
          industry: industry || null,
        },
      });
    }

    const token = await createSession(user.id, user.role);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
