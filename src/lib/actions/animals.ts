"use server";

import { db } from "@/lib/db";
import { animals } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { animalIntakeSchema, animalUpdateSchema } from "@/lib/validations/animals";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { Animal } from "@/types";

export async function createAnimalIntake(
  _prevState: ActionResult<Animal> | null,
  formData: FormData,
): Promise<ActionResult<Animal>> {
  const permCheck = await requirePermission("animal:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const isPickedUp = formData.get("isPickedUpByShelter") === "true";
  const intakeReason = (formData.get("intakeReason") as string) || undefined;

  // Build intakeMetadata when shelter pickup or IBN
  const hasMetadata = isPickedUp || intakeReason === "ibn";
  const intakeMetadata = hasMetadata
    ? {
        melderNaam: (formData.get("intakeMetadata.melderNaam") as string) || undefined,
        melderLocatie: (formData.get("intakeMetadata.melderLocatie") as string) || undefined,
        melderDatum: (formData.get("intakeMetadata.melderDatum") as string) || undefined,
        betrokkenInstanties: (formData.get("intakeMetadata.betrokkenInstanties") as string) || undefined,
      }
    : undefined;

  const raw = {
    name: (formData.get("name") as string) || "",
    species: formData.get("species") as string,
    gender: (formData.get("gender") as string) || "",
    breed: (formData.get("breed") as string) || undefined,
    color: (formData.get("color") as string) || undefined,
    dateOfBirth: (formData.get("dateOfBirth") as string) || undefined,
    identificationNr: (formData.get("identificationNr") as string) || undefined,
    passportNr: (formData.get("passportNr") as string) || undefined,
    intakeDate: (formData.get("intakeDate") as string) || "",
    intakeReason,
    description: (formData.get("description") as string) || undefined,
    shortDescription: (formData.get("shortDescription") as string) || undefined,
    isPickedUpByShelter: isPickedUp,
    dossierNr: (formData.get("dossierNr") as string) || undefined,
    pvNr: (formData.get("pvNr") as string) || undefined,
    intakeMetadata,
  };

  const parsed = animalIntakeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const slug = slugify(parsed.data.name);

    // Calculate IBN 60-day deadline (FR-06)
    let ibnDecisionDeadline: string | null = null;
    if (parsed.data.intakeReason === "ibn" && parsed.data.intakeDate) {
      const deadline = new Date(parsed.data.intakeDate + "T12:00:00");
      deadline.setDate(deadline.getDate() + 60);
      ibnDecisionDeadline = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, "0")}-${String(deadline.getDate()).padStart(2, "0")}`;
    }

    const [animal] = await db
      .insert(animals)
      .values({
        name: parsed.data.name,
        slug,
        species: parsed.data.species,
        gender: parsed.data.gender,
        breed: parsed.data.breed || null,
        color: parsed.data.color || null,
        dateOfBirth: parsed.data.dateOfBirth || null,
        identificationNr: parsed.data.identificationNr || null,
        passportNr: parsed.data.passportNr || null,
        intakeDate: parsed.data.intakeDate || null,
        intakeReason: parsed.data.intakeReason || null,
        description: parsed.data.description || "",
        shortDescription: parsed.data.shortDescription || null,
        isPickedUpByShelter: parsed.data.isPickedUpByShelter,
        intakeMetadata: parsed.data.intakeMetadata || null,
        dossierNr: parsed.data.dossierNr || null,
        pvNr: parsed.data.pvNr || null,
        ibnDecisionDeadline,
        workflowPhase: "intake",
        status: "beschikbaar",
        isInShelter: true,
      })
      .returning();

    await logAudit("create_animal", "animal", animal.id, null, animal);
    revalidatePath("/beheerder/dieren");

    return { success: true, data: animal };
  } catch (err: unknown) {
    const pgError = err as { code?: string };
    if (pgError.code === "23505") {
      return {
        success: false,
        fieldErrors: { name: ["Er bestaat al een dier met deze naam. Kies een andere naam."] },
      };
    }
    return {
      success: false,
      error: "Er ging iets mis bij het registreren. Probeer het later opnieuw.",
    };
  }
}

export async function updateAnimal(
  _prevState: ActionResult<Animal> | null,
  formData: FormData,
): Promise<ActionResult<Animal>> {
  const permCheck = await requirePermission("animal:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const raw = {
    id: formData.get("id"),
    name: (formData.get("name") as string) || "",
    aliasName: (formData.get("aliasName") as string) || undefined,
    breed: (formData.get("breed") as string) || undefined,
    color: (formData.get("color") as string) || undefined,
    dateOfBirth: (formData.get("dateOfBirth") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    shortDescription: (formData.get("shortDescription") as string) || undefined,
    identificationNr: (formData.get("identificationNr") as string) || undefined,
    passportNr: (formData.get("passportNr") as string) || undefined,
    barcode: (formData.get("barcode") as string) || undefined,
    isOnWebsite: formData.get("isOnWebsite") === "true",
    isFeatured: formData.get("isFeatured") === "true",
  };

  const parsed = animalUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const [oldAnimal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, parsed.data.id))
      .limit(1);
    if (!oldAnimal) return { success: false, error: "Dier niet gevonden" };

    const slug = slugify(parsed.data.name);
    const [updated] = await db
      .update(animals)
      .set({
        name: parsed.data.name,
        slug,
        aliasName: parsed.data.aliasName || sql`null`,
        breed: parsed.data.breed || sql`null`,
        color: parsed.data.color || sql`null`,
        dateOfBirth: parsed.data.dateOfBirth || sql`null`,
        description: parsed.data.description || sql`null`,
        shortDescription: parsed.data.shortDescription || sql`null`,
        identificationNr: parsed.data.identificationNr || sql`null`,
        passportNr: parsed.data.passportNr || sql`null`,
        barcode: parsed.data.barcode || sql`null`,
        isOnWebsite: parsed.data.isOnWebsite,
        isFeatured: parsed.data.isFeatured,
        updatedAt: new Date(),
      })
      .where(eq(animals.id, parsed.data.id))
      .returning();

    await logAudit("update_animal", "animal", updated.id, oldAnimal, updated);
    revalidatePath("/beheerder/dieren");

    return { success: true, data: updated };
  } catch (err: unknown) {
    const pgError = err as { code?: string };
    if (pgError.code === "23505") {
      return {
        success: false,
        fieldErrors: { name: ["Er bestaat al een dier met deze naam. Kies een andere naam."] },
      };
    }
    return {
      success: false,
      error: "Er ging iets mis bij het opslaan. Probeer het later opnieuw.",
    };
  }
}
