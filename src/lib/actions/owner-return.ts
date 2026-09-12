"use server";

import { db } from "@/lib/db";
import { ownerReturnForms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { getAnimalById } from "@/lib/queries/animals";
import { getLastOwnerReturnNr, getOwnerReturnForm, type OwnerReturnFormRow } from "@/lib/queries/owner-return";
import { ownerReturnFormSchema, OWNER_RETURN_FIELDS, type OwnerReturnFormInput } from "@/lib/validations/owner-return";
import { formatBelgianDate, nextOwnerReturnNr, ownerFullName } from "@/lib/animals/owner-return";
import { buildOwnerReturnAttachment } from "@/lib/animals/owner-return-document";
import { ownerReturnCopyEmail } from "@/lib/email/templates/owner-return-copy";
import { sendEmail } from "@/lib/email/send";
import { isUniqueViolation } from "@/lib/db/errors";
import type { ActionResult } from "@/types";

/**
 * Story 10.64 — het formulier "Terug naar eigenaar": opslaan, en de kopie voor de
 * eigenaar mailen. Opladen van de getekende versie gaat via een API-route
 * (bestanden), zoals bij de adoptiecontracten.
 */

type Waarden = Record<keyof OwnerReturnFormInput, string>;

function readForm(formData: FormData): Waarden {
  const w = {} as Waarden;
  for (const veld of OWNER_RETURN_FIELDS) w[veld] = (formData.get(veld) as string) || "";
  return w;
}

const leegIsNull = (v: string) => (v ? v : null);

const MAIL_MISLUKT = "De mail kon niet verstuurd worden. Probeer later opnieuw of druk het formulier af.";

export async function createOwnerReturnForm(
  _prev: ActionResult<{ id: number }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  const permCheck = await requirePermission("animal:write");
  if (permCheck && !permCheck.success) return { success: false, error: permCheck.error };

  const animalId = Number(formData.get("animalId"));
  const waarden = readForm(formData);
  if (!Number.isInteger(animalId) || animalId <= 0) {
    return { success: false, error: "Ongeldig dier", values: waarden };
  }

  const parsed = ownerReturnFormSchema.safeParse(waarden);
  if (!parsed.success) {
    return { success: false, fieldErrors: parsed.error.flatten().fieldErrors, values: waarden };
  }

  const animal = await getAnimalById(animalId);
  if (!animal) return { success: false, error: "Dier niet gevonden", values: waarden };

  const session = await getSession();
  const d = parsed.data;
  const jaar = Number(d.drawnUpOn.slice(0, 4));

  // Twee collega's die tegelijk opslaan, kunnen hetzelfde volgnummer berekenen; de
  // uniciteit op form_nr vangt dat, en dan proberen we één keer met het volgende.
  for (let poging = 0; poging < 2; poging++) {
    try {
      // Ook het opzoeken van het laatste nummer hoort in de try: faalt dát, dan
      // moeten de ingevulde waarden evengoed terug naar het scherm (review 10.64).
      const formNr = nextOwnerReturnNr(jaar, await getLastOwnerReturnNr(jaar));
      const [record] = await db
        .insert(ownerReturnForms)
        .values({
          formNr,
          animalId,
          drawnUpOn: d.drawnUpOn,
          drawnUpAt: leegIsNull(d.drawnUpAt),
          ownerLastName: d.ownerLastName,
          ownerFirstName: d.ownerFirstName,
          ownerStreet: leegIsNull(d.ownerStreet),
          ownerPostalCode: leegIsNull(d.ownerPostalCode),
          ownerCity: leegIsNull(d.ownerCity),
          ownerCountry: leegIsNull(d.ownerCountry),
          ownerBirthDate: leegIsNull(d.ownerBirthDate),
          ownerBirthPlace: leegIsNull(d.ownerBirthPlace),
          ownerPhone: leegIsNull(d.ownerPhone),
          ownerMobile: leegIsNull(d.ownerMobile),
          ownerEmail: leegIsNull(d.ownerEmail),
          animalName: d.animalName,
          animalSpecies: leegIsNull(d.animalSpecies),
          animalBreed: leegIsNull(d.animalBreed),
          animalBirthDate: leegIsNull(d.animalBirthDate),
          animalIdentificationNr: leegIsNull(d.animalIdentificationNr),
          animalGender: d.animalGender,
          animalNeutered: d.animalNeutered,
          animalPedigree: d.animalPedigree,
          animalPassportNr: leegIsNull(d.animalPassportNr),
          animalCoatDescription: leegIsNull(d.animalCoatDescription),
          stayCosts: leegIsNull(d.stayCosts),
          totalPaid: leegIsNull(d.totalPaid),
          createdBy: session?.userId ?? null,
        })
        .returning();

      await logAudit("create_owner_return_form", "owner_return_form", record.id, null, record);
      revalidatePath(`/beheerder/dieren/${animalId}`);
      return { success: true, data: { id: record.id } };
    } catch (err) {
      if (isUniqueViolation(err) && poging === 0) continue;
      console.error("createOwnerReturnForm failed:", err);
      return { success: false, error: "Er ging iets mis bij het opslaan van het formulier.", values: waarden };
    }
  }
  return { success: false, error: "Er ging iets mis bij het opslaan van het formulier.", values: waarden };
}

/** Mailt het formulier (de getekende versie als die er is) naar het adres op het formulier. */
export async function emailOwnerReturnCopy(animalId: number, formId: number): Promise<ActionResult> {
  const permCheck = await requirePermission("animal:write");
  if (permCheck && !permCheck.success) return { success: false, error: permCheck.error };

  const form: OwnerReturnFormRow | null = await getOwnerReturnForm(animalId, formId);
  if (!form) return { success: false, error: "Formulier niet gevonden" };

  const naar = form.ownerEmail?.trim();
  if (!naar) return { success: false, error: "Er staat geen e-mailadres van de eigenaar op het formulier." };

  let bijlage: Awaited<ReturnType<typeof buildOwnerReturnAttachment>>;
  try {
    bijlage = await buildOwnerReturnAttachment(form);
  } catch (err) {
    console.error("emailOwnerReturnCopy: bijlage mislukt:", err);
    return { success: false, error: "De bijlage kon niet opgebouwd worden. Probeer later opnieuw." };
  }

  const mail = ownerReturnCopyEmail({
    ownerName: ownerFullName(form),
    animalName: form.animalName,
    formNr: form.formNr,
    drawnUpOn: formatBelgianDate(form.drawnUpOn),
    signed: bijlage.signed,
  });

  const result = await sendEmail({
    to: naar,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    attachments: [{ filename: bijlage.filename, content: bijlage.content }],
  });

  if (!result.success) {
    // De Resend-fout kan het adres bevatten; die blijft server-side.
    console.error("emailOwnerReturnCopy: versturen mislukt:", result.error);
    return { success: false, error: MAIL_MISLUKT };
  }

  const nu = new Date();
  await db
    .update(ownerReturnForms)
    .set({ copyEmailedTo: naar, copyEmailedAt: nu })
    .where(eq(ownerReturnForms.id, formId));

  await logAudit("owner_return_form.copy_emailed", "owner_return_form", formId, null, {
    to: naar,
    signed: bijlage.signed,
    resendId: result.id,
  });
  revalidatePath(`/beheerder/dieren/${animalId}`);
  revalidatePath(`/beheerder/dieren/${animalId}/terug-naar-eigenaar/${formId}`);

  return {
    success: true,
    data: undefined,
    message: bijlage.signed
      ? `De getekende versie is gemaild naar ${naar}.`
      : `Het ingevulde formulier is gemaild naar ${naar}.`,
  };
}
