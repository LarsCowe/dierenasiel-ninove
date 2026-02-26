"use server";

import { db } from "@/lib/db";
import { animals } from "@/lib/db/schema";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { animalIntakeSchema } from "@/lib/validations/animals";
import { slugify } from "@/lib/utils";
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
    intakeReason: (formData.get("intakeReason") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    shortDescription: (formData.get("shortDescription") as string) || undefined,
    isPickedUpByShelter: isPickedUp,
    intakeMetadata: isPickedUp
      ? {
          melderNaam: (formData.get("intakeMetadata.melderNaam") as string) || undefined,
          melderLocatie: (formData.get("intakeMetadata.melderLocatie") as string) || undefined,
          melderDatum: (formData.get("intakeMetadata.melderDatum") as string) || undefined,
        }
      : undefined,
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
        status: "beschikbaar",
        isInShelter: true,
      })
      .returning();

    await logAudit("create_animal", "animal", animal.id, null, animal);

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
