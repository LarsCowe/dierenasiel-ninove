"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requirePermission } from "@/lib/permissions";
import { createUserSchema, updateUserSchema } from "@/lib/validations/users";
import { hashPassword } from "@/lib/auth/password";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type { ActionResult } from "@/types";

export async function createUser(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("user:manage");
  if (permCheck) return permCheck;

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  };

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validatie mislukt",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Check for duplicate email
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existing) {
    return { success: false, error: "Er bestaat al een gebruiker met dit e-mailadres" };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await db.insert(users).values({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    role: parsed.data.role,
  });

  revalidatePath("/beheerder/gebruikers");
  return { success: true, data: undefined, message: "Gebruiker aangemaakt." };
}

export async function updateUser(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("user:manage");
  if (permCheck) return permCheck;

  const raw = {
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    isActive: formData.get("isActive") === "true",
  };

  const parsed = updateUserSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Validatie mislukt",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Check for duplicate email (excluding self)
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existing && existing.id !== parsed.data.id) {
    return { success: false, error: "Er bestaat al een andere gebruiker met dit e-mailadres" };
  }

  await db
    .update(users)
    .set({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
    })
    .where(eq(users.id, parsed.data.id));

  revalidatePath("/beheerder/gebruikers");
  return { success: true, data: undefined, message: "Gebruiker bijgewerkt." };
}

export async function resetUserPassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("user:manage");
  if (permCheck) return permCheck;

  const id = Number(formData.get("id"));
  const password = formData.get("password") as string;

  if (!id || id <= 0) {
    return { success: false, error: "Ongeldig ID" };
  }

  if (!password || password.length < 6) {
    return { success: false, error: "Wachtwoord moet minstens 6 tekens zijn" };
  }

  const passwordHash = await hashPassword(password);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, id));

  revalidatePath("/beheerder/gebruikers");
  return { success: true, data: undefined, message: "Wachtwoord gereset." };
}
