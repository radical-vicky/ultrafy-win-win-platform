import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/types";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateOtpCode, hashOtpCode, OTP_TTL_MS } from "@/lib/otp";
import { dispatchOtp } from "@/lib/dispatch-otp";

export async function POST(req: NextRequest) {
  // 10 attempts per 15 min per IP — generous for real users, tight enough to slow brute-forcing
  const limited = await rateLimit(`login:${getClientIp(req)}`, 10, 15 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Please verify your email before logging in.", requiresVerification: true, email: user.email },
      { status: 403 }
    );
  }

  // Password correct + email verified — now require a fresh OTP before
  // actually issuing a session. No cookie is set on this response; the
  // client must call /api/auth/login/verify-otp with the code to finish.
  const code = generateOtpCode();
  await prisma.emailOtp.create({
    data: { userId: user.id, codeHash: hashOtpCode(code), purpose: "LOGIN", expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  dispatchOtp({ email: user.email, phone: user.phone, code }).catch((err) => console.error("[otp] login dispatch failed", err));

  return NextResponse.json({ requiresOtp: true, email: user.email });
}
