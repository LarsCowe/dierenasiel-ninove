"use server";

import { db } from "@/lib/db";
import { animals, vaccinations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { evaluateCatOutgoingGuards, type GuardContext, type GuardWarning } from "@/lib/workflow/guards";
import {
  changeStatusSchema,
  registerOuttakeSchema,
  TERMINAL_STATUSES,
  type AnimalStatus,
  type OuttakeReason,
} from "@/lib/validations/animals-status";
import type { ActionResult } from "@/types";

const OUTTAKE_STATUS_MAP: Record<OuttakeReason, AnimalStatus> = {
  adoptie: "geadopteerd",
  terug_eigenaar: "terug_eigenaar",
  euthanasie: "geeuthanaseerd",
};

export async function changeStatus(
  animalId: number,
  newStatus: string,
): Promise<ActionResult> {
  const permCheck = await requirePermission("animal:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const parsed = changeStatusSchema.safeParse({ animalId, newStatus });
  if (!parsed.success) {
    return {
      success: false,
      error: "Ongeldige invoer",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Terminal statuses can only be set via the outtake flow
  if ((TERMINAL_STATUSES as readonly string[]).includes(parsed.data.newStatus)) {
    return {
      success: false,
      error: "Deze status kan alleen via uitstroomregistratie worden ingesteld",
    };
  }

  try {
    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, parsed.data.animalId))
      .limit(1);

    if (!animal) {
      return { success: false, error: "Dier niet gevonden" };
    }

    const [updated] = await db
      .update(animals)
      .set({
        status: parsed.data.newStatus,
        updatedAt: new Date(),
      })
      .where(eq(animals.id, parsed.data.animalId))
      .returning();

    await logAudit("change_status", "animal", parsed.data.animalId, animal, updated);
    revalidatePath("/beheerder/dieren");
    revalidatePath(`/beheerder/dieren/${parsed.data.animalId}`);

    return { success: true, data: undefined };
  } catch (err) {
    console.error("changeStatus failed:", err);
    return { success: false, error: "Er ging iets mis bij het wijzigen van de status" };
  }
}

export async function toggleAdoptionAvailability(
  animalId: number,
  available: boolean,
): Promise<ActionResult> {
  const permCheck = await requirePermission("animal:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  try {
    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (!animal) {
      return { success: false, error: "Dier niet gevonden" };
    }

    const [updated] = await db
      .update(animals)
      .set({
        isAvailableForAdoption: available,
        updatedAt: new Date(),
      })
      .where(eq(animals.id, animalId))
      .returning();

    await logAudit("toggle_adoption_availability", "animal", animalId, animal, updated);
    revalidatePath("/beheerder/dieren");
    revalidatePath(`/beheerder/dieren/${animalId}`);

    return { success: true, data: undefined };
  } catch (err) {
    console.error("toggleAdoptionAvailability failed:", err);
    return { success: false, error: "Er ging iets mis bij het wijzigen van de adoptiebeschikbaarheid" };
  }
}

export async function registerOuttake(
  animalId: number,
  outtakeReason: string,
  outtakeDate: string,
  overrideGuards?: boolean,
  overrideReason?: string,
): Promise<ActionResult & { guardWarnings?: GuardWarning[] }> {
  const permCheck = await requirePermission("animal:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const parsed = registerOuttakeSchema.safeParse({ animalId, outtakeReason, outtakeDate });
  if (!parsed.success) {
    return {
      success: false,
      error: "Ongeldige invoer",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const [animal] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, parsed.data.animalId))
      .limit(1);

    if (!animal) {
      return { success: false, error: "Dier niet gevonden" };
    }

    // Cat guard evaluation for adoptie/terug_eigenaar (FR-10)
    if (
      animal.species === "kat" &&
      (parsed.data.outtakeReason === "adoptie" || parsed.data.outtakeReason === "terug_eigenaar")
    ) {
      const vaccinationResults = await db
        .select({ id: vaccinations.id })
        .from(vaccinations)
        .where(eq(vaccinations.animalId, parsed.data.animalId))
        .limit(1);

      const guardContext: GuardContext = {
        animal: {
          id: animal.id,
          species: animal.species,
          identificationNr: animal.identificationNr,
          isNeutered: animal.isNeutered ?? false,
        },
        hasVaccinations: vaccinationResults.length > 0,
        hasAdoptionContract: true, // not relevant for outtake
      };

      const warnings = evaluateCatOutgoingGuards(guardContext);

      if (warnings.length > 0) {
        if (!overrideGuards) {
          return {
            success: false,
            error: "Er zijn waarschuwingen bij deze uitstroom.",
            guardWarnings: warnings,
          };
        }
        if (!overrideReason) {
          return { success: false, error: "Reden is verplicht bij het overriden van waarschuwingen." };
        }
      }
    }

    const newStatus = OUTTAKE_STATUS_MAP[parsed.data.outtakeReason];

    const updateValues: Partial<typeof animals.$inferInsert> = {
      status: newStatus,
      isInShelter: false,
      outtakeDate: parsed.data.outtakeDate,
      outtakeReason: parsed.data.outtakeReason,
      kennelId: null,
      updatedAt: new Date(),
    };

    // adoptedDate moet gezet worden bij adoptie: dashboard "Recente Adopties"
    // filtert op adoptedDate IS NOT NULL.
    if (parsed.data.outtakeReason === "adoptie") {
      updateValues.adoptedDate = parsed.data.outtakeDate;
    }

    const [updated] = await db
      .update(animals)
      .set(updateValues)
      .where(eq(animals.id, parsed.data.animalId))
      .returning();

    const auditNewValues = overrideGuards && overrideReason
      ? { ...updated, guardOverrideReason: overrideReason }
      : updated;
    await logAudit("register_outtake", "animal", parsed.data.animalId, animal, auditNewValues);
    revalidatePath("/beheerder/dieren");
    revalidatePath(`/beheerder/dieren/${parsed.data.animalId}`);
    revalidatePath("/beheerder/dieren/kennel");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("registerOuttake failed:", err);
    return { success: false, error: "Er ging iets mis bij het registreren van de uitstroom" };
  }
}
