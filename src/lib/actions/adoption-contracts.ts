"use server";

import { db } from "@/lib/db";
import { adoptionContracts, adoptionCandidates, animals, animalTodos, postAdoptionFollowups } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { adoptionContractSchema } from "@/lib/validations/adoption-contracts";
import { getAnimalById } from "@/lib/queries/animals";
import { getVaccinationsByAnimalId } from "@/lib/queries/vaccinations";
import { getSession } from "@/lib/auth/session";
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

  // Story 10.20+: candidate is nu optioneel — alleen bestaan-check, geen status-check.
  // De beheerder bepaalt zelf wanneer een contract gemaakt mag worden.
  let candidate: typeof adoptionCandidates.$inferSelect | undefined;
  if (parsed.data.candidateId) {
    try {
      const [found] = await db
        .select()
        .from(adoptionCandidates)
        .where(eq(adoptionCandidates.id, parsed.data.candidateId))
        .limit(1);
      if (!found) return { success: false, error: "Kandidaat niet gevonden" };
      candidate = found;
    } catch {
      return { success: false, error: "Fout bij ophalen kandidaat" };
    }
  }

  // Check animal exists
  const animal = await getAnimalById(parsed.data.animalId);
  if (!animal) return { success: false, error: "Dier niet gevonden" };

  // AC2: Kattenvalidatie (FR-02, SC-5) — Story 10.20+: van harde fout naar
  // overruleerbare waarschuwing. De client toont een confirm-popup; bij
  // bevestiging wordt opnieuw gesubmit met overrideCatWarnings=true.
  if (animal.species === "kat" && !parsed.data.overrideCatWarnings) {
    const errors: string[] = [];
    if (!animal.identificationNr) errors.push("gechipt");
    const vaccinations = await getVaccinationsByAnimalId(animal.id);
    if (vaccinations.length === 0) errors.push("gevaccineerd");
    if (!animal.isNeutered) errors.push("gesteriliseerd");
    if (errors.length > 0) {
      return {
        success: false,
        error: `Katten moeten ${errors.join(", ")} zijn vóór adoptie`,
        warning: "cat-prerequisites",
      };
    }
  }

  // Story 10.20+: chipregistratie is wettelijk verplicht — blokkerende validatie
  // (zelfde look & feel als ontbrekend bedrag, blijft op het form staan).
  if (animal.species !== "kat" && !animal.identificationNr) {
    return {
      success: false,
      error: "Chipregistratie ontbreekt — wettelijk verplicht bij adoptie",
    };
  }

  // AC4: Deadline berekening
  const deadline = addDays(parsed.data.contractDate, 14);

  try {
    const [record] = await db
      .insert(adoptionContracts)
      .values({
        animalId: parsed.data.animalId,
        candidateId: parsed.data.candidateId ?? null,
        contractDate: parsed.data.contractDate,
        paymentAmount: parsed.data.paymentAmount,
        paymentMethod: parsed.data.paymentMethod,
        dogidCatidTransferDeadline: deadline,
        dogidCatidTransferred: false,
        notes: parsed.data.notes || null,
        status: "klaar_voor_handtekening",
        // Snapshot-velden: bevriezen de adoptant/dier-data nu.
        snapshotAdoptantFirstName: parsed.data.adoptantFirstName,
        snapshotAdoptantLastName: parsed.data.adoptantLastName,
        snapshotAdoptantEmail: parsed.data.adoptantEmail || null,
        snapshotAdoptantPhone: parsed.data.adoptantPhone || null,
        snapshotAdoptantAddress: parsed.data.adoptantAddress || null,
        snapshotAdoptantBirthDate: parsed.data.adoptantBirthDate || null,
        snapshotAdoptantIdNumber: parsed.data.adoptantIdNumber || null,
        snapshotAnimalName: parsed.data.animalName,
        snapshotAnimalSpecies: parsed.data.animalSpecies || null,
        snapshotAnimalBreed: parsed.data.animalBreed || null,
        snapshotAnimalBirthDate: parsed.data.animalBirthDate || null,
        snapshotAnimalGender: parsed.data.animalGender || null,
        snapshotAnimalColor: parsed.data.animalColor || null,
        snapshotAnimalChipNr: parsed.data.animalChipNr || null,
        snapshotAnimalPassportNr: parsed.data.animalPassportNr || null,
        snapshotAnimalDescription: parsed.data.animalDescription || null,
        snapshotAnimalNeutered: parsed.data.animalNeutered ?? null,
      })
      .returning();

    // AC5: Update candidate status to adopted (alleen wanneer een kandidaat gekoppeld is)
    if (candidate) {
      await db
        .update(adoptionCandidates)
        .set({ status: "adopted" })
        .where(eq(adoptionCandidates.id, candidate.id));
    }

    // AC5: Update animal
    await db
      .update(animals)
      .set({
        status: "geadopteerd",
        isInShelter: false,
        adoptedDate: parsed.data.contractDate,
        outtakeDate: parsed.data.contractDate,
        outtakeReason: "adoptie",
      })
      .where(eq(animals.id, animal.id));

    // Story 4.5 AC1: Auto-create DogID/CatID overdracht todo (non-critical)
    try {
      await db.insert(animalTodos).values({
        animalId: parsed.data.animalId,
        type: "dogid_catid_overdracht",
        description: `DogID/CatID overdracht melden voor ${animal.name} (deadline: ${deadline})`,
        dueDate: deadline,
        priority: "hoog",
        isAutoGenerated: true,
      });
    } catch (err) {
      console.error("Auto-todo creation failed (non-critical):", err);
    }

    // Story 4.6 AC2: Auto-create post-adoption followups (non-critical)
    try {
      await db.insert(postAdoptionFollowups).values([
        { contractId: record.id, followupType: "1_week", date: addDays(parsed.data.contractDate, 7), status: "planned" },
        { contractId: record.id, followupType: "1_month", date: addDays(parsed.data.contractDate, 30), status: "planned" },
      ]);
    } catch (err) {
      console.error("Auto-followup creation failed (non-critical):", err);
    }

    await logAudit("create_adoption_contract", "adoption_contract", record.id, null, record);
    revalidatePath("/beheerder/adoptie");

    return { success: true, data: record as AdoptionContract };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis bij het opslaan. Probeer het later opnieuw.",
    };
  }
}

// Story 10.20: status-updates voor contract-workflow.
const ALLOWED_STATUSES = [
  "draft",
  "klaar_voor_handtekening",
  "verzonden_voor_digitale_handtekening",
  "getekend",
  "geannuleerd",
] as const;
type ContractStatus = (typeof ALLOWED_STATUSES)[number];

export async function updateContractStatusAction(
  contractId: number,
  newStatus: ContractStatus,
): Promise<ActionResult> {
  const permCheck = await requirePermission("adoption:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  if (!ALLOWED_STATUSES.includes(newStatus)) {
    return { success: false, error: "Ongeldige status" };
  }

  try {
    const [existing] = await db
      .select()
      .from(adoptionContracts)
      .where(eq(adoptionContracts.id, contractId))
      .limit(1);
    if (!existing) return { success: false, error: "Contract niet gevonden" };

    await db
      .update(adoptionContracts)
      .set({ status: newStatus })
      .where(eq(adoptionContracts.id, contractId));

    await logAudit(
      "update_contract_status",
      "adoption_contract",
      contractId,
      { status: existing.status },
      { status: newStatus },
    );
    revalidatePath("/beheerder/adoptie");
    revalidatePath(`/beheerder/adoptie/contracten/${contractId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("updateContractStatusAction failed:", err);
    return { success: false, error: "Status-wijziging mislukt" };
  }
}

export async function sendContractForDigitalSigningAction(
  contractId: number,
): Promise<ActionResult> {
  const permCheck = await requirePermission("adoption:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  try {
    const [existing] = await db
      .select()
      .from(adoptionContracts)
      .where(eq(adoptionContracts.id, contractId))
      .limit(1);
    if (!existing) return { success: false, error: "Contract niet gevonden" };
    if (existing.status === "getekend") {
      return { success: false, error: "Contract is al getekend" };
    }

    await db
      .update(adoptionContracts)
      .set({ status: "verzonden_voor_digitale_handtekening" })
      .where(eq(adoptionContracts.id, contractId));

    await logAudit(
      "send_for_digital_signing",
      "adoption_contract",
      contractId,
      { status: existing.status },
      { status: "verzonden_voor_digitale_handtekening" },
    );
    revalidatePath("/beheerder/adoptie");
    revalidatePath(`/beheerder/adoptie/contracten/${contractId}`);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("sendContractForDigitalSigningAction failed:", err);
    return { success: false, error: "Versturen mislukt" };
  }
}

export async function cancelContractAction(contractId: number): Promise<ActionResult> {
  const permCheck = await requirePermission("adoption:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  try {
    const [existing] = await db
      .select()
      .from(adoptionContracts)
      .where(eq(adoptionContracts.id, contractId))
      .limit(1);
    if (!existing) return { success: false, error: "Contract niet gevonden" };
    if (existing.status === "getekend") {
      return { success: false, error: "Een getekend contract kan niet meer geannuleerd worden" };
    }

    await db
      .update(adoptionContracts)
      .set({ status: "geannuleerd" })
      .where(eq(adoptionContracts.id, contractId));

    // Story 10.20+: bij annulering ook de side-effects op kandidaat + dier ongedaan maken,
    // anders blijft de aanvraag op 'adopted' staan en het dier op 'geadopteerd' terwijl
    // er functioneel geen adoptie heeft plaatsgevonden.
    if (existing.candidateId) {
      await db
        .update(adoptionCandidates)
        .set({ status: "approved" })
        .where(eq(adoptionCandidates.id, existing.candidateId));
    }

    const [animalRow] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, existing.animalId))
      .limit(1);

    if (animalRow && animalRow.status === "geadopteerd") {
      await db
        .update(animals)
        .set({
          status: "beschikbaar",
          isInShelter: true,
          adoptedDate: null,
          outtakeDate: null,
          outtakeReason: null,
        })
        .where(eq(animals.id, existing.animalId));
    }

    await logAudit(
      "cancel_contract",
      "adoption_contract",
      contractId,
      { status: existing.status },
      { status: "geannuleerd" },
    );
    revalidatePath("/beheerder/adoptie");
    revalidatePath("/beheerder/dieren");
    revalidatePath(`/beheerder/dieren/${existing.animalId}`);
    if (existing.candidateId) {
      revalidatePath(`/beheerder/adoptie/${existing.candidateId}`);
    }
    return { success: true, data: undefined };
  } catch (err) {
    console.error("cancelContractAction failed:", err);
    return { success: false, error: "Annuleren mislukt" };
  }
}

// Story 4.5 AC2: Mark DogID/CatID transfer as completed
export async function markDogidCatidTransferred(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("adoption:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const contractId = Number(formData.get("contractId"));
  if (!contractId || isNaN(contractId)) {
    return { success: false, error: "Ongeldig contract ID" };
  }

  try {
    // Find contract
    const [contract] = await db
      .select()
      .from(adoptionContracts)
      .where(eq(adoptionContracts.id, contractId))
      .limit(1);
    if (!contract) return { success: false, error: "Contract niet gevonden" };
    if (contract.dogidCatidTransferred) {
      return { success: false, error: "DogID/CatID overdracht is reeds geregistreerd" };
    }

    // Update contract
    await db
      .update(adoptionContracts)
      .set({ dogidCatidTransferred: true })
      .where(eq(adoptionContracts.id, contractId));

    // Complete the related auto-generated todo
    const session = await getSession();
    const [todo] = await db
      .select()
      .from(animalTodos)
      .where(
        and(
          eq(animalTodos.animalId, contract.animalId),
          eq(animalTodos.type, "dogid_catid_overdracht"),
        ),
      )
      .limit(1);

    if (todo && !todo.isCompleted) {
      await db
        .update(animalTodos)
        .set({
          isCompleted: true,
          completedAt: new Date(),
          completedByUserId: session?.userId ?? null,
        })
        .where(eq(animalTodos.id, todo.id));
    }

    await logAudit(
      "mark_dogid_catid_transferred",
      "adoption_contract",
      contract.id,
      { dogidCatidTransferred: false },
      { dogidCatidTransferred: true },
    );

    revalidatePath("/beheerder/adoptie");
    revalidatePath("/beheerder/dieren");
    revalidatePath("/beheerder/dieren/[id]", "page");
    revalidatePath("/beheerder");

    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: "Er ging iets mis. Probeer het later opnieuw.",
    };
  }
}
