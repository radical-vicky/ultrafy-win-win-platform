import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/types";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateOtpCode, hashOtpCode, OTP_TTL_MS } from "@/lib/otp";
import { dispatchOtp } from "@/lib/dispatch-otp";

export async function POST(req: NextRequest) {
  // 5 signups per hour per IP — enough for a real person, blocks bulk account creation
  const limited = await rateLimit(`register:${getClientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many signup attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, phone, password, role } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) {
    return NextResponse.json(
      { error: existing.email === email ? "An account with that email already exists." : "An account with that phone number already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role, termsAcceptedAt: new Date() },
  });

  const code = generateOtpCode();
  await prisma.emailOtp.create({
    data: { userId: user.id, codeHash: hashOtpCode(code), purpose: "SIGNUP", expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  dispatchOtp({ email: user.email, phone: user.phone, code }).catch((err) => console.error("[otp] dispatch failed", err));

  // No session cookie yet — the account isn't usable until the email is verified.
  return NextResponse.json({ email: user.email }, { status: 201 });
}
