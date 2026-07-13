import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOtpCode, hashOtpCode, OTP_TTL_MS, OTP_RESEND_COOLDOWN_MS } from "@/lib/otp";
import { dispatchOtp } from "@/lib/dispatch-otp";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  purpose: z.enum(["SIGNUP", "LOGIN"]).default("SIGNUP"),
});

export async function POST(req: NextRequest) {
  // Coarse IP-based limit as a backstop; the real 60s pacing is per-account below.
  const limited = await rateLimit(`resend-otp:${getClientIp(req)}`, 10, 15 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  const { email, purpose } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Same generic response whether or not the account exists, to avoid email enumeration.
  const generic = NextResponse.json({ message: "If that account needs a code, a new one has been sent." });

  if (!user) return generic;
  // SIGNUP codes are only useful before verification; LOGIN codes only after.
  if (purpose === "SIGNUP" && user.emailVerified) return generic;
  if (purpose === "LOGIN" && !user.emailVerified) return generic;

  const lastOtp = await prisma.emailOtp.findFirst({ where: { userId: user.id, purpose }, orderBy: { createdAt: "desc" } });
  if (lastOtp && Date.now() - lastOtp.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - lastOtp.createdAt.getTime())) / 1000);
    return NextResponse.json({ error: `Please wait ${waitSeconds}s before requesting another code.` }, { status: 429 });
  }

  const code = generateOtpCode();
  await prisma.emailOtp.create({
    data: { userId: user.id, codeHash: hashOtpCode(code), purpose, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  dispatchOtp({ email: user.email, phone: user.phone, code }).catch((err) => console.error("[otp] resend dispatch failed", err));

  return generic;
}
