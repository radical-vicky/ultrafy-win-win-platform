import { createHash, randomInt } from "crypto";

export function generateOtpCode(): string {
  // 6-digit numeric code, zero-padded (e.g. "004821")
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes, matches the spec
export const OTP_MAX_ATTEMPTS = 5; // lock the code after this many wrong guesses
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60s between resends
