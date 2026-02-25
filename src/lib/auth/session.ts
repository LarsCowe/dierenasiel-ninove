import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dierenasiel-ninove-dev-secret-change-in-prod"
);

const SESSION_COOKIE = "session";
const GUEST_COOKIE = "guest-mode";
export const SESSION_DURATION = 8 * 60 * 60; // 8 hours in seconds
const REFRESH_THRESHOLD = 60 * 60; // Refresh if < 1 hour remaining

export interface SessionPayload {
  userId: number;
  email: string;
  role: string;
  name: string;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(SECRET);
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION, // 8 hours
    path: "/",
  });
}

export async function refreshSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    const session = payload as unknown as SessionPayload & { exp?: number };

    // Sliding window: re-issue token if less than REFRESH_THRESHOLD remaining
    const now = Math.floor(Date.now() / 1000);
    if (session.exp && session.exp - now < REFRESH_THRESHOLD) {
      const newToken = await createSession({
        userId: session.userId,
        email: session.email,
        role: session.role,
        name: session.name,
      });
      await setSessionCookie(newToken);
    }

    return {
      userId: session.userId,
      email: session.email,
      role: session.role,
      name: session.name,
    };
  } catch {
    return null;
  }
}

export async function setGuestCookie() {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_COOKIE, "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(GUEST_COOKIE);
}

export function hasAuthCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  return (
    cookieHeader.includes(`${SESSION_COOKIE}=`) ||
    cookieHeader.includes(`${GUEST_COOKIE}=`)
  );
}
