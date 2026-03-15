import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createSession(userId: string, role: string): Promise<string> {
  const token = `${userId}:${role}:${Date.now()}`;
  const encoded = Buffer.from(token).toString('base64');
  return encoded;
}

export function parseSession(token: string): { userId: string; role: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, role] = decoded.split(':');
    if (!userId || !role) return null;
    return { userId, role };
  } catch {
    return null;
  }
}

export async function getUserFromToken(token: string) {
  const session = parseSession(token);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { candidateProfile: true, companyProfile: true },
  });
  return user;
}
