import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, SessionPayload } from "@/lib/auth";

/** Read + verify the session cookie in a Server Component or Route Handler. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireOwner(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("FORBIDDEN");
  return session;
}

/** Alias for requireOwner's actual behavior (any authenticated session) — clearer name for non-owner pages like Favorites. */
export const requireUser = requireOwner;
