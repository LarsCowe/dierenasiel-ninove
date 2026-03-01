import { db } from "@/lib/db";
import { adoptionCandidates, walkers, users, mailingSendRecipients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { ANONYMIZED_VALUE } from "@/lib/constants";

/**
 * Anonymise an adoption candidate's personal data.
 * Returns the old record for audit logging, or null if not found / already anonymised.
 */
export async function anonymizeAdoptionCandidate(
  candidateId: number,
): Promise<Record<string, unknown> | null> {
  // 1. Fetch the record
  const [candidate] = await db
    .select()
    .from(adoptionCandidates)
    .where(eq(adoptionCandidates.id, candidateId))
    .limit(1);

  if (!candidate) return null;

  // 2. Already anonymised — idempotent
  if (candidate.anonymisedAt) return null;

  // 3. Store old record for audit
  const oldRecord = { ...candidate };

  // 4. Update PII fields
  await db
    .update(adoptionCandidates)
    .set({
      firstName: ANONYMIZED_VALUE,
      lastName: ANONYMIZED_VALUE,
      email: ANONYMIZED_VALUE,
      phone: ANONYMIZED_VALUE,
      address: ANONYMIZED_VALUE,
      questionnaireAnswers: {},
      notes: null,
      anonymisedAt: new Date(),
    })
    .where(eq(adoptionCandidates.id, candidateId));

  // 5. Anonymise denormalised PII in mailing_send_recipients
  await db
    .update(mailingSendRecipients)
    .set({
      email: ANONYMIZED_VALUE,
      recipientName: ANONYMIZED_VALUE,
    })
    .where(eq(mailingSendRecipients.email, candidate.email));

  return oldRecord;
}

/**
 * Anonymise a walker's personal data, delete their photo from Vercel Blob,
 * deactivate linked user account, and clean denormalised PII.
 * Returns the old record for audit logging, or null if not found / already anonymised.
 */
export async function anonymizeWalker(
  walkerId: number,
): Promise<Record<string, unknown> | null> {
  // 1. Fetch the record
  const [walker] = await db
    .select()
    .from(walkers)
    .where(eq(walkers.id, walkerId))
    .limit(1);

  if (!walker) return null;

  // 2. Already anonymised — idempotent
  if (walker.anonymisedAt) return null;

  // 3. Store old record for audit
  const oldRecord = { ...walker };

  // 4. Delete photo from Vercel Blob (best-effort)
  if (walker.photoUrl) {
    try {
      await del(walker.photoUrl);
    } catch (err) {
      console.error("Blob delete failed for walker photo:", err);
    }
  }

  // 5. Update PII fields
  await db
    .update(walkers)
    .set({
      firstName: ANONYMIZED_VALUE,
      lastName: ANONYMIZED_VALUE,
      email: ANONYMIZED_VALUE,
      phone: ANONYMIZED_VALUE,
      address: ANONYMIZED_VALUE,
      dateOfBirth: "1970-01-01",
      allergies: null,
      photoUrl: null,
      childrenWalkAlong: false,
      rejectionReason: null,
      anonymisedAt: new Date(),
    })
    .where(eq(walkers.id, walkerId));

  // 6. Deactivate and anonymise linked user
  if (walker.userId) {
    await db
      .update(users)
      .set({
        name: ANONYMIZED_VALUE,
        email: `anonymised-${walker.userId}@verwijderd.local`,
        isActive: false,
      })
      .where(eq(users.id, walker.userId));
  }

  // 7. Anonymise denormalised PII in mailing_send_recipients
  await db
    .update(mailingSendRecipients)
    .set({
      email: ANONYMIZED_VALUE,
      recipientName: ANONYMIZED_VALUE,
    })
    .where(eq(mailingSendRecipients.email, walker.email));

  return oldRecord;
}
