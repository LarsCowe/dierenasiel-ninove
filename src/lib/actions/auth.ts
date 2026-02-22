"use server";

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  createSession,
  setSessionCookie,
  setGuestCookie,
  clearSessionCookies,
} from "@/lib/auth/session";

export async function loginAsGuest() {
  await setGuestCookie();
}

export async function loginWithCredentials(email: string, password: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);

  if (!user) {
    return { error: "Ongeldig e-mailadres of wachtwoord." };
  }

  if (!user.isActive) {
    return { error: "Dit account is niet actief." };
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return { error: "Ongeldig e-mailadres of wachtwoord." };
  }

  const token = await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  await setSessionCookie(token);

  // Update last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  return { role: user.role };
}

export async function logout() {
  await clearSessionCookies();
}
