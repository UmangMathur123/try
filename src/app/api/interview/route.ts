import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSession } from '@/lib/auth';
import { generateQuestion, evaluateResponse, createInterviewPlan, getNextStage } from '@/lib/gemini';
import { calculateTechnicalScore, calculateCommunicationScore, calculateIntegrityScore, calculateFinalScore, getShortlistStatus, MINIMUM_RESUME_MATCH } from '@/lib/scoring';

// POST /api/interview - start, ask question, evaluate, or complete
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = parseSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start':
        return handleStart(body, session);
      case 'next_question':
        return handleNextQuestion(body);
      case 'evaluate':
        return handleEvaluate(body);
      case 'complete':
        return handleComplete(body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Interview error:', error);
    return NextResponse.json({ error: error.message || 'Interview error' }, { status: 500 });
  }
}

async function handleStart(body: any, session: { userId: string; role: string }) {
  const { applicationId } = body;
  if (!applicationId) return NextResponse.json({ error: 'Application ID required' }, { status: 400 });

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: true,
      candidate: true,
      interview: true,
    },
  });

  if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

  // Check 75% minimum resume match
  if (application.resumeMatchScore < MINIMUM_RESUME_MATCH) {
    return NextResponse.json({ 
      error: `Resume match score is ${Math.round(application.resumeMatchScore)}%. Minimum ${MINIMUM_RESUME_MATCH}% is required to start the interview. Please update your skills/resume to improve your match.` 
    }, { status: 403 });
  }

  // Check if interview already exists
  if (application.interview && application.interview.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Interview already completed' }, { status: 400 });
  }

  let interview = application.interview;
  if (!interview) {
    interview = await prisma.interview.create({
      data: {
        applicationId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'INTERVIEW_SCHEDULED' },
    });
  } else if (interview.status === 'NOT_STARTED') {
    interview = await prisma.interview.update({
      where: { id: interview.id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });
  }

  // Create interview plan
  const plan = createInterviewPlan(application.job.title, application.job.experienceMin);

  // Generate first question
  const candidateSkills = application.candidate.skills.split(',').filter(Boolean);
  const questionData = generateQuestion(
    application.job.title,
    application.job.description,
    candidateSkills,
    [],
    'INTRO',
    0,
    plan.totalQuestions
  );

  const question = await prisma.question.create({
    data: {
      interviewId: interview.id,
      text: questionData.question,
      category: questionData.category,
      difficulty: questionData.difficulty,
      orderNum: 1,
    },
  });

  return NextResponse.json({
    interview,
    question,
    plan,
    jobTitle: application.job.title,
    jobDescription: application.job.description,
    candidateSkills,
  });
}

async function handleNextQuestion(body: any) {
  const { interviewId, jobTitle, jobDescription, candidateSkills } = body;
  if (!interviewId) return NextResponse.json({ error: 'Interview ID required' }, { status: 400 });

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      questions: { orderBy: { orderNum: 'asc' } },
      application: { include: { job: true } },
    },
  });

  if (!interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

  const job = interview.application.job;
  const plan = createInterviewPlan(job.title, job.experienceMin);
  const currentIndex = interview.questions.length;

  if (currentIndex >= plan.totalQuestions) {
    return NextResponse.json({ completed: true, plan });
  }

  const stage = getNextStage(plan, currentIndex);
  const previousQuestions = interview.questions.map((q) => q.text);
  const skills = (candidateSkills || job.requiredSkills.split(',').filter(Boolean));

  const questionData = generateQuestion(
    jobTitle || job.title,
    jobDescription || job.description,
    skills,
    previousQuestions,
    stage,
    currentIndex,
    plan.totalQuestions
  );

  const question = await prisma.question.create({
    data: {
      interviewId,
      text: questionData.question,
      category: questionData.category,
      difficulty: questionData.difficulty,
      orderNum: currentIndex + 1,
    },
  });

  // Update interview stage
  await prisma.interview.update({
    where: { id: interviewId },
    data: { currentStage: stage },
  });

  return NextResponse.json({
    question,
    currentIndex,
    totalQuestions: plan.totalQuestions,
    stage,
    plan,
  });
}

async function handleEvaluate(body: any) {
  const { questionId, answer, candidateSkills, jobTitle, voiceConfidence } = body;
  if (!questionId || !answer) {
    return NextResponse.json({ error: 'Question ID and answer required' }, { status: 400 });
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { interview: { include: { application: { include: { job: true, candidate: true } } } } },
  });

  if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

  const job = question.interview.application.job;
  const candidate = question.interview.application.candidate;
  const skills = candidateSkills || candidate.skills.split(',').filter(Boolean);

  const evaluation = evaluateResponse(
    question.text,
    answer,
    question.category,
    skills,
    jobTitle || job.title,
    voiceConfidence || 0.8
  );

  const response = await prisma.response.create({
    data: {
      questionId,
      answerText: answer,
      relevanceScore: evaluation.relevanceScore,
      clarityScore: evaluation.clarityScore,
      depthScore: evaluation.depthScore,
      correctnessScore: evaluation.correctnessScore,
      totalScore: evaluation.totalScore,
      aiEvaluation: evaluation.feedback,
    },
  });

  return NextResponse.json({ response, evaluation });
}

async function handleComplete(body: any) {
  const { interviewId } = body;
  if (!interviewId) return NextResponse.json({ error: 'Interview ID required' }, { status: 400 });

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      questions: { include: { response: true } },
      proctoringFlags: true,
      application: { include: { candidate: true } },
    },
  });

  if (!interview) return NextResponse.json({ error: 'Interview not found' }, { status: 404 });

  const responses = interview.questions
    .filter((q) => q.response)
    .map((q) => ({
      correctnessScore: q.response!.correctnessScore,
      depthScore: q.response!.depthScore,
      clarityScore: q.response!.clarityScore,
      relevanceScore: q.response!.relevanceScore,
      category: q.category,
    }));

  const technicalScore = calculateTechnicalScore(responses);
  const communicationScore = calculateCommunicationScore(responses);
  // Use enhanced integrity scoring with flag types
  const integrityScore = calculateIntegrityScore(interview.proctoringFlags.map(f => ({ type: f.type })));
  const resumeMatchScore = interview.application.resumeMatchScore;

  const overallScore = calculateFinalScore(
    resumeMatchScore,
    technicalScore,
    communicationScore,
    integrityScore
  );

  const updatedInterview = await prisma.interview.update({
    where: { id: interviewId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      overallScore,
      technicalScore,
      communicationScore,
      integrityScore,
    },
  });

  // Update application status
  const status = getShortlistStatus(overallScore);
  await prisma.application.update({
    where: { id: interview.applicationId },
    data: { status },
  });

  return NextResponse.json({
    interview: updatedInterview,
    scores: {
      resumeMatch: resumeMatchScore,
      technical: technicalScore,
      communication: communicationScore,
      integrity: integrityScore,
      overall: overallScore,
      status,
    },
  });
}

// GET - fetch interview details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const interviewId = searchParams.get('id');
    const applicationId = searchParams.get('applicationId');

    if (interviewId) {
      const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        include: {
          questions: { include: { response: true }, orderBy: { orderNum: 'asc' } },
          proctoringFlags: true,
          application: { include: { job: true, candidate: { include: { user: true } } } },
        },
      });
      return NextResponse.json({ interview });
    }

    if (applicationId) {
      const interview = await prisma.interview.findUnique({
        where: { applicationId },
        include: {
          questions: { include: { response: true }, orderBy: { orderNum: 'asc' } },
          proctoringFlags: true,
          application: { include: { job: true, candidate: { include: { user: true } } } },
        },
      });
      return NextResponse.json({ interview });
    }

    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  } catch (error) {
    console.error('Get interview error:', error);
    return NextResponse.json({ error: 'Failed to fetch interview' }, { status: 500 });
  }
}
