"use server";

import { db } from "@/lib/db";
import { animals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
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

export async function registerOuttake(
  animalId: number,
  outtakeReason: string,
  outtakeDate: string,
): Promise<ActionResult> {
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

    // Cat validation for adoptie/terug_eigenaar (FR-02)
    if (
      animal.species === "kat" &&
      (parsed.data.outtakeReason === "adoptie" || parsed.data.outtakeReason === "terug_eigenaar")
    ) {
      const errors: string[] = [];
      if (!animal.identificationNr) {
        errors.push("De kat moet gechipt zijn (chipnummer ontbreekt)");
      }
      if (!animal.isNeutered) {
        errors.push("De kat moet gesteriliseerd/gecastreerd zijn");
      }
      // TODO: vaccinatiecheck toevoegen wanneer Epic 3 (Medische Opvolging) is geïmplementeerd
      if (errors.length > 0) {
        return {
          success: false,
          error: errors.join(". "),
        };
      }
    }

    const newStatus = OUTTAKE_STATUS_MAP[parsed.data.outtakeReason];

    const [updated] = await db
      .update(animals)
      .set({
        status: newStatus,
        isInShelter: false,
        outtakeDate: parsed.data.outtakeDate,
        outtakeReason: parsed.data.outtakeReason,
        kennelId: null,
        updatedAt: new Date(),
      })
      .where(eq(animals.id, parsed.data.animalId))
      .returning();

    await logAudit("register_outtake", "animal", parsed.data.animalId, animal, updated);
    revalidatePath("/beheerder/dieren");
    revalidatePath(`/beheerder/dieren/${parsed.data.animalId}`);
    revalidatePath("/beheerder/dieren/kennel");

    return { success: true, data: undefined };
  } catch (err) {
    console.error("registerOuttake failed:", err);
    return { success: false, error: "Er ging iets mis bij het registreren van de uitstroom" };
  }
}
