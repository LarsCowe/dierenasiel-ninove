import { db } from "@/lib/db";
import { medicationLogs, medications, animals } from "@/lib/db/schema";
import { eq, desc, and, gte, lt, inArray } from "drizzle-orm";
import type { MedicationLog } from "@/types";
import { getBelgianDayBounds } from "@/lib/utils/date";

export interface MedicationWithTodayStatus {
  medication: {
    id: number;
    medicationName: string;
    dosage: string;
    quantity: string | null;
    startDate: string;
    endDate: string | null;
    notes: string | null;
    animalId: number;
  };
  animal: {
    id: number;
    name: string;
    species: string;
    imageUrl: string | null;
    kennelId: number | null;
  };
  todayLog: {
    id: number;
    administeredAt: Date;
    administeredBy: string | null;
    notes: string | null;
  } | null;
}

export async function getMedicationLogsByMedicationId(
  medicationId: number,
): Promise<MedicationLog[]> {
  try {
    return await db
      .select()
      .from(medicationLogs)
      .where(eq(medicationLogs.medicationId, medicationId))
      .orderBy(desc(medicationLogs.administeredAt)) as MedicationLog[];
  } catch (err) {
    console.error("getMedicationLogsByMedicationId query failed:", err);
    return [];
  }
}

export async function getActiveMedicationsWithTodayStatus(): Promise<
  MedicationWithTodayStatus[]
> {
  try {
    const { start, end } = getBelgianDayBounds();

    const activeMeds = await db
      .select({
        medication: {
          id: medications.id,
          medicationName: medications.medicationName,
          dosage: medications.dosage,
          quantity: medications.quantity,
          startDate: medications.startDate,
          endDate: medications.endDate,
          notes: medications.notes,
          animalId: medications.animalId,
        },
        animal: {
          id: animals.id,
          name: animals.name,
          species: animals.species,
          imageUrl: animals.imageUrl,
          kennelId: animals.kennelId,
        },
      })
      .from(medications)
      .innerJoin(animals, eq(medications.animalId, animals.id))
      .where(eq(medications.isActive, true))
      .orderBy(animals.name, medications.medicationName);

    const medIds = activeMeds.map((r) => r.medication.id);
    if (medIds.length === 0) return [];

    const todayLogs = await db
      .select()
      .from(medicationLogs)
      .where(
        and(
          inArray(medicationLogs.medicationId, medIds),
          gte(medicationLogs.administeredAt, start),
          lt(medicationLogs.administeredAt, end),
        ),
      )
      .orderBy(desc(medicationLogs.administeredAt));

    const logMap = new Map<number, MedicationLog>();
    for (const log of todayLogs as MedicationLog[]) {
      if (!logMap.has(log.medicationId)) {
        logMap.set(log.medicationId, log);
      }
    }

    return activeMeds.map((row) => {
      const log = logMap.get(row.medication.id);
      return {
        medication: row.medication,
        animal: row.animal,
        todayLog: log
          ? {
              id: log.id,
              administeredAt: log.administeredAt,
              administeredBy: log.administeredBy,
              notes: log.notes,
            }
          : null,
      };
    });
  } catch (err) {
    console.error("getActiveMedicationsWithTodayStatus query failed:", err);
    return [];
  }
}

export async function getTodayMedicationLogsByAnimalId(
  animalId: number,
): Promise<MedicationLog[]> {
  try {
    // First get all medication IDs for this animal
    const animalMeds = await db
      .select({ id: medications.id })
      .from(medications)
      .where(eq(medications.animalId, animalId));

    if (animalMeds.length === 0) return [];

    const medIds = animalMeds.map((m) => m.id);

    const { start, end } = getBelgianDayBounds();

    return await db
      .select()
      .from(medicationLogs)
      .where(
        and(
          inArray(medicationLogs.medicationId, medIds),
          gte(medicationLogs.administeredAt, start),
          lt(medicationLogs.administeredAt, end),
        ),
      ) as MedicationLog[];
  } catch (err) {
    console.error("getTodayMedicationLogsByAnimalId query failed:", err);
    return [];
  }
}
