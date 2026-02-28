"use server";

import { db } from "@/lib/db";
import { adoptionContracts, adoptionCandidates, animals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { adoptionContractSchema } from "@/lib/validations/adoption-contracts";
import { getAnimalById } from "@/lib/queries/animals";
import { getVaccinationsByAnimalId } from "@/lib/queries/vaccinations";
import { revalidatePath } from "next/cache";
import type { ActionResult, AdoptionContract } from "@/types";

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export async function createAdoptionContract(
  _prevState: ActionResult<AdoptionContract> | null,
  formData: FormData,
): Promise<ActionResult<AdoptionContract>> {
  const permCheck = await requirePermission("adoption:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(formData.get("json") as string);
  } catch {
    return { success: false, error: "Ongeldige gegevens" };
  }

  const parsed = adoptionContractSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Check candidate exists and is approved
  let candidate;
  try {
    const [found] = await db
      .select()
      .from(adoptionCandidates)
      .where(eq(adoptionCandidates.id, parsed.data.candidateId))
      .limit(1);
    if (!found) return { success: false, error: "Kandidaat niet gevonden" };
    if (found.status !== "approved") {
      return { success: false, error: "Alleen een goedgekeurde kandidaat kan een contract krijgen" };
    }
    candidate = found;
  } catch {
    return { success: false, error: "Fout bij ophalen kandidaat" };
  }

  // Check animal exists
  const animal = await getAnimalById(parsed.data.animalId);
  if (!animal) return { success: false, error: "Dier niet gevonden" };

  // AC2: Kattenvalidatie (FR-02, SC-5)
  if (animal.species === "kat") {
    const errors: string[] = [];
    if (!animal.identificationNr) errors.push("gechipt");
    const vaccinations = await getVaccinationsByAnimalId(animal.id);
    if (vaccinations.length === 0) errors.push("gevaccineerd");
    if (!animal.isNeutered) errors.push("gesteriliseerd");
    if (errors.length > 0) {
      return {
        success: false,
        error: `Katten moeten ${errors.join(", ")} zijn vóór adoptie`,
      };
    }
  }

  // AC3: Chipwaarschuwing voor niet-katten
  let warning: string | undefined;
  if (animal.species !== "kat" && !animal.identificationNr) {
    warning = "Chipregistratie ontbreekt — wettelijk verplicht bij adoptie";
  }

  // AC4: Deadline berekening
  const deadline = addDays(parsed.data.contractDate, 14);

  try {
    const [record] = await db
      .insert(adoptionContracts)
      .values({
        animalId: parsed.data.animalId,
        candidateId: parsed.data.candidateId,
        contractDate: parsed.data.contractDate,
        paymentAmount: parsed.data.paymentAmount,
        paymentMethod: parsed.data.paymentMethod,
        dogidCatidTransferDeadline: deadline,
        dogidCatidTransferred: false,
        notes: parsed.data.notes || null,
      })
      .returning();

    // AC5: Update candidate status to adopted
    await db
      .update(adoptionCandidates)
      .set({ status: "adopted" })
      .where(eq(adoptionCandidates.id, candidate.id));

    // AC5: Update animal
    await db
      .update(animals)
      .set({
        status: "geadopteerd",
        isInShelter: false,
        outtakeDate: parsed.data.contractDate,
        outtakeReason: "adoptie",
      })
      .where(eq(animals.id, animal.id));

    await logAudit("create_adoption_contract", "adoption_contract", record.id, null, record);
    revalidatePath("/beheerder/adoptie");

    return { success: true, data: record as AdoptionContract, message: warning };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het opslaan. Probeer het later opnieuw.",
    };
  }
}
