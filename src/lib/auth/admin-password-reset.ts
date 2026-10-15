import { randomInt, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { AdminPasswordReset } from '@/models/AdminPasswordReset';

export const OTP_TTL_MS = 10 * 60 * 1000;
export const RESET_TOKEN_TTL = '15m';
export const MAX_OTP_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 10;

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('Missing AUTH_SECRET environment variable.');
  }
  return new TextEncoder().encode(secret);
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, BCRYPT_ROUNDS);
}

export async function verifyOtpHash(
  code: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Fingerprint for one-time reset tokens (stored optional audit). */
export function fingerprintToken(token: string): string {
  return createHash('sha256').update(token).digest('hex').slice(0, 32);
}

export type AdminResetTokenPayload = {
  sub: string;
  email: string;
  purpose: 'admin_pw_reset';
};

export async function signAdminResetToken(payload: {
  sub: string;
  email: string;
}): Promise<string> {
  return new SignJWT({
    email: payload.email,
    purpose: 'admin_pw_reset',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(RESET_TOKEN_TTL)
    .sign(getAuthSecret());
}

export async function verifyAdminResetToken(
  token: string
): Promise<AdminResetTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    const email = typeof payload.email === 'string' ? payload.email : null;
    const purpose =
      typeof payload.purpose === 'string' ? payload.purpose : null;
    if (!sub || !email || purpose !== 'admin_pw_reset') return null;
    return { sub, email, purpose: 'admin_pw_reset' };
  } catch {
    return null;
  }
}

export async function createPasswordResetChallenge(input: {
  email: string;
  adminId: string;
  otpCode: string;
}) {
  const otpHash = await hashOtp(input.otpCode);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await AdminPasswordReset.deleteMany({
    email: input.email,
    consumedAt: null,
  });
  return AdminPasswordReset.create({
    email: input.email,
    adminId: input.adminId,
    otpHash,
    attempts: 0,
    expiresAt,
    consumedAt: null,
  });
}

export function passwordStrengthOk(password: string): boolean {
  return password.length >= 8 && password.length <= 200;
}
