import { randomBytes, createHash } from "crypto";

/** Generates a raw token (sent to the user) and its hash (stored in the DB). */
export function generateResetToken() {
  const raw = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashResetToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
