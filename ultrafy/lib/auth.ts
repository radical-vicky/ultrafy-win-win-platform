import { SignJWT, jwtVerify } from "jose";

// Edge-safe module: only jose here. Password hashing lives in lib/password.ts
// so bcryptjs never gets pulled into the middleware bundle.

const secretKey = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
const encodedKey = new TextEncoder().encode(secretKey);

export type SessionPayload = {
  userId: string;
  email: string;
  role: "OWNER" | "ADMIN";
  name: string;
};

const COOKIE_NAME = "ultrafy_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(encodedKey);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ["HS256"] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_MAX_AGE = SESSION_DURATION_SECONDS;
