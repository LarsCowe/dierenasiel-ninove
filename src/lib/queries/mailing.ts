import { db } from "@/lib/db";
import { adoptionCandidates, adoptionContracts, animals, mailingSends, mailingSendRecipients } from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import type { MailingRecipient, MailingSend, MailingSendRecipient } from "@/types";

export interface MailingRecipientFilters {
  dateFrom?: string;
  dateTo?: string;
  species?: string;
}

export async function getMailingRecipients(
  filters: MailingRecipientFilters,
): Promise<MailingRecipient[]> {
  try {
    const conditions = [eq(adoptionCandidates.status, "adopted")];

    if (filters.dateFrom) {
      conditions.push(gte(adoptionContracts.contractDate, filters.dateFrom));
    }
    if (filters.dateTo) {
      conditions.push(lte(adoptionContracts.contractDate, filters.dateTo));
    }
    if (filters.species) {
      conditions.push(eq(animals.species, filters.species));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const rows = await db
      .select({
        candidateId: adoptionCandidates.id,
        firstName: adoptionCandidates.firstName,
        lastName: adoptionCandidates.lastName,
        email: adoptionCandidates.email,
        animalName: animals.name,
        contractDate: adoptionContracts.contractDate,
      })
      .from(adoptionCandidates)
      .innerJoin(adoptionContracts, eq(adoptionContracts.candidateId, adoptionCandidates.id))
      .innerJoin(animals, eq(animals.id, adoptionContracts.animalId))
      .where(whereClause)
      .orderBy(desc(adoptionContracts.contractDate));

    return rows as MailingRecipient[];
  } catch (err) {
    console.error("getMailingRecipients query failed:", err);
    return [];
  }
}

export async function getMailingSends(): Promise<MailingSend[]> {
  try {
    const rows = await db
      .select()
      .from(mailingSends)
      .orderBy(desc(mailingSends.createdAt));

    return rows as MailingSend[];
  } catch (err) {
    console.error("getMailingSends query failed:", err);
    return [];
  }
}

export async function getMailingSendRecipients(
  sendId: number,
): Promise<MailingSendRecipient[]> {
  try {
    const rows = await db
      .select()
      .from(mailingSendRecipients)
      .where(eq(mailingSendRecipients.sendId, sendId))
      .orderBy(desc(mailingSendRecipients.sentAt));

    return rows as MailingSendRecipient[];
  } catch (err) {
    console.error("getMailingSendRecipients query failed:", err);
    return [];
  }
}
