import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = parseSession(token);
    if (!session || session.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Only candidates can upload resumes' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF, DOC, DOCX, and TXT files are allowed' }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.name);
    const filename = `${session.userId}_${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const resumePath = `/uploads/resumes/${filename}`;

    // Update candidate profile
    await prisma.candidateProfile.update({
      where: { userId: session.userId },
      data: { resumePath },
    });

    // Extract text content from the file for keywords (basic text extraction)
    let extractedText = '';
    if (file.type === 'text/plain') {
      extractedText = buffer.toString('utf-8');
    } else {
      // For PDF/DOC, extract readable ASCII text
      extractedText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r]/g, ' ').replace(/\s+/g, ' ');
    }

    return NextResponse.json({
      success: true,
      resumePath,
      filename: file.name,
      size: file.size,
      extractedTextLength: extractedText.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
