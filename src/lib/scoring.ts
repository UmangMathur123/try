// Scoring algorithms for the interview platform

export function calculateResumeMatchScore(
  candidateSkills: string[],
  requiredSkills: string[]
): number {
  if (requiredSkills.length === 0) return 50;
  if (candidateSkills.length === 0) return 0;

  const normalizedCandidate = new Set(candidateSkills.map((s) => s.toLowerCase().trim()));
  const normalizedRequired = requiredSkills.map((s) => s.toLowerCase().trim());

  let matched = 0;
  for (const skill of normalizedRequired) {
    for (const cs of normalizedCandidate) {
      if (cs === skill || cs.includes(skill) || skill.includes(cs)) {
        matched++;
        break;
      }
    }
  }

  return Math.round((matched / normalizedRequired.length) * 100);
}

export function calculateTechnicalScore(
  responses: { correctnessScore: number; depthScore: number; category: string }[]
): number {
  const techResponses = responses.filter((r) =>
    ['TECHNICAL', 'ANALYTICAL'].includes(r.category)
  );
  if (techResponses.length === 0) return 0;

  const total = techResponses.reduce(
    (sum, r) => sum + r.correctnessScore * 0.6 + r.depthScore * 0.4,
    0
  );
  return Math.round((total / techResponses.length) * 10) / 10;
}

export function calculateCommunicationScore(
  responses: { clarityScore: number; relevanceScore: number }[]
): number {
  if (responses.length === 0) return 0;

  const total = responses.reduce(
    (sum, r) => sum + r.clarityScore * 0.5 + r.relevanceScore * 0.5,
    0
  );
  return Math.round((total / responses.length) * 10) / 10;
}

// Enhanced integrity scoring with differentiated penalties
export function calculateIntegrityScore(
  flags: { type: string }[]
): number {
  let score = 100;
  
  for (const flag of flags) {
    switch (flag.type) {
      case 'MULTIPLE_FACES':
        score -= 10; // Two people detected - heavy penalty
        break;
      case 'NO_FACE':
        score -= 8; // Camera off for >5 seconds
        break;
      case 'BACKGROUND_NOISE':
        score -= 5; // Excessive noise
        break;
      case 'LOOKING_AWAY':
        score -= 3; // Eye gaze away
        break;
      case 'TAB_SWITCH':
        score -= 5; // Tab switch
        break;
      default:
        score -= 5;
    }
  }
  
  return Math.max(0, score);
}

// Legacy compatibility: accept count-based scoring too
export function calculateIntegrityScoreFromCount(flagCount: number): number {
  return Math.max(0, 100 - flagCount * 5);
}

export function calculateFinalScore(
  resumeMatch: number,
  technical: number,
  communication: number,
  integrity: number
): number {
  // Normalize technical and communication to 0-100 scale (from 0-10)
  const techNormalized = technical * 10;
  const commNormalized = communication * 10;

  const finalScore =
    resumeMatch * 0.15 +
    techNormalized * 0.45 +
    commNormalized * 0.25 +
    integrity * 0.15;

  return Math.round(finalScore * 10) / 10;
}

export function getShortlistStatus(finalScore: number): string {
  if (finalScore >= 70) return 'SHORTLISTED';
  return 'REJECTED';
}

export function getScoreGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

// Minimum resume match percentage required to start interview
export const MINIMUM_RESUME_MATCH = 75;
