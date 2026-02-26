import { db } from "@/lib/db";
import { vaccinations, medications, animals } from "@/lib/db/schema";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import type { MedicalAlert } from "@/types";

/**
 * Returns medical alerts for the dashboard: overdue/upcoming vaccinations
 * and expiring active medications (within 7 days, max 30 days overdue).
 * Only includes animals currently in the shelter.
 */
export async function getMedicalAlerts(limit = 15): Promise<MedicalAlert[]> {
  try {
    const [vaccRows, medRows] = await Promise.all([
      db
        .select({
          animalId: animals.id,
          animalName: animals.name,
          type: vaccinations.type,
          nextDueDate: vaccinations.nextDueDate,
        })
        .from(vaccinations)
        .innerJoin(animals, eq(vaccinations.animalId, animals.id))
        .where(
          and(
            isNotNull(vaccinations.nextDueDate),
            eq(animals.isInShelter, true),
            sql`${vaccinations.nextDueDate} <= CURRENT_DATE + INTERVAL '7 days'`,
            sql`${vaccinations.nextDueDate} >= CURRENT_DATE - INTERVAL '30 days'`,
          ),
        ),
      db
        .select({
          animalId: animals.id,
          animalName: animals.name,
          medicationName: medications.medicationName,
          dosage: medications.dosage,
          endDate: medications.endDate,
        })
        .from(medications)
        .innerJoin(animals, eq(medications.animalId, animals.id))
        .where(
          and(
            isNotNull(medications.endDate),
            eq(medications.isActive, true),
            eq(animals.isInShelter, true),
            sql`${medications.endDate} <= CURRENT_DATE + INTERVAL '7 days'`,
            sql`${medications.endDate} >= CURRENT_DATE - INTERVAL '30 days'`,
          ),
        ),
    ]);

    const alerts: MedicalAlert[] = [
      ...vaccRows
        .filter((r) => r.nextDueDate != null)
        .map((r) => ({
          category: "vaccination" as const,
          animalId: r.animalId,
          animalName: r.animalName,
          label: `${r.type} vaccinatie`,
          dueDate: r.nextDueDate as string,
        })),
      ...medRows
        .filter((r) => r.endDate != null)
        .map((r) => ({
          category: "medication" as const,
          animalId: r.animalId,
          animalName: r.animalName,
          label: `${r.medicationName} ${r.dosage}`,
          dueDate: r.endDate as string,
        })),
    ];

    alerts.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return alerts.slice(0, limit);
  } catch (err) {
    console.error("getMedicalAlerts query failed:", err);
    return [];
  }
}
