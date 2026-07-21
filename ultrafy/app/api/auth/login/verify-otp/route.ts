import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtpSchema } from "@/types";
import { hashOtpCode, OTP_MAX_ATTEMPTS } from "@/lib/otp";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(`login-otp:${getClientIp(req)}`, 10, 15 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and 6-digit code." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return NextResponse.json({ error: "No account found for that email." }, { status: 404 });

  const otp = await prisma.emailOtp.findFirst({
    where: { userId: user.id, usedAt: null, purpose: "LOGIN" },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.expiresAt < new Date()) {
    return NextResponse.json({ error: "This code has expired. Log in again to get a new one." }, { status: 400 });
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Too many incorrect attempts. Log in again to get a new code." }, { status: 400 });
  }
  if (hashOtpCode(parsed.data.code) !== otp.codeHash) {
    await prisma.emailOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  await prisma.emailOtp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });

  // Create session token with type assertion
  const token = await signSession({
    userId: user.id,
    email: user.email,
    role: user.role as "OWNER" | "ADMIN" | "TENANT",
    name: user.name
  });
  
  const res = NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
