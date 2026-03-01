import { db } from "@/lib/db";
import { animals, behaviorRecords, vetVisits, medications, vetInspectionReports } from "@/lib/db/schema";
import { eq, and, asc, desc, gte, lte, sql } from "drizzle-orm";
import type { Animal, BehaviorRecord, VetInspectionReport } from "@/types";

export interface AnimalReportFilters {
  species?: string;
  status?: string;
  kennelId?: number;
  workflowPhase?: string;
  page?: number;
  pageSize?: number;
}

export interface AnimalReportResult {
  animals: Animal[];
  total: number;
}

export async function getAnimalReport(
  filters: AnimalReportFilters,
): Promise<AnimalReportResult> {
  const { species, status, kennelId, workflowPhase, page, pageSize } = filters;

  const conditions = [];
  if (species) conditions.push(eq(animals.species, species));
  if (status) conditions.push(eq(animals.status, status));
  if (kennelId) conditions.push(eq(animals.kennelId, kennelId));
  if (workflowPhase) conditions.push(eq(animals.workflowPhase, workflowPhase));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    if (page && pageSize) {
      const results = await db
        .select()
        .from(animals)
        .where(whereClause)
        .orderBy(asc(animals.name))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(animals)
        .where(whereClause);

      return {
        animals: results as Animal[],
        total: (totalResult as { count: number }[])[0]?.count ?? 0,
      };
    }

    // No pagination — return all results (used for PDF/CSV export)
    const results = await db
      .select()
      .from(animals)
      .where(whereClause)
      .orderBy(asc(animals.name));

    return {
      animals: results as Animal[],
      total: results.length,
    };
  } catch (err) {
    console.error("getAnimalReport query failed:", err);
    return { animals: [], total: 0 };
  }
}

export async function getBehaviorReportByAnimalId(
  animalId: number,
): Promise<BehaviorRecord[]> {
  try {
    const results = await db
      .select()
      .from(behaviorRecords)
      .where(eq(behaviorRecords.animalId, animalId))
      .orderBy(desc(behaviorRecords.date));
    return results as BehaviorRecord[];
  } catch (err) {
    console.error("getBehaviorReportByAnimalId query failed:", err);
    return [];
  }
}

// ==================== R2: Vet Visits Report ====================

export interface VetVisitReportFilters {
  dateFrom?: string;
  dateTo?: string;
  location?: string;
  page?: number;
  pageSize?: number;
}

export interface VetVisitReportRow {
  id: number;
  animalId: number;
  animalName: string;
  animalSpecies: string;
  date: string;
  location: string;
  complaints: string | null;
  todo: string | null;
  isCompleted: boolean;
  completedAt: Date | null;
  notes: string | null;
}

export interface VetVisitReportResult {
  visits: VetVisitReportRow[];
  total: number;
}

export async function getVetVisitsReport(
  filters: VetVisitReportFilters,
): Promise<VetVisitReportResult> {
  const { dateFrom, dateTo, location, page, pageSize } = filters;

  const conditions = [];
  if (dateFrom) conditions.push(gte(vetVisits.date, dateFrom));
  if (dateTo) conditions.push(lte(vetVisits.date, dateTo));
  if (location) conditions.push(eq(vetVisits.location, location));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const selectFields = {
    id: vetVisits.id,
    animalId: vetVisits.animalId,
    animalName: animals.name,
    animalSpecies: animals.species,
    date: vetVisits.date,
    location: vetVisits.location,
    complaints: vetVisits.complaints,
    todo: vetVisits.todo,
    isCompleted: vetVisits.isCompleted,
    completedAt: vetVisits.completedAt,
    notes: vetVisits.notes,
  };

  try {
    if (page && pageSize) {
      const results = await db
        .select(selectFields)
        .from(vetVisits)
        .innerJoin(animals, eq(vetVisits.animalId, animals.id))
        .where(whereClause)
        .orderBy(desc(vetVisits.date))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(vetVisits)
        .where(whereClause);

      return {
        visits: results as VetVisitReportRow[],
        total: (totalResult as { count: number }[])[0]?.count ?? 0,
      };
    }

    const results = await db
      .select(selectFields)
      .from(vetVisits)
      .innerJoin(animals, eq(vetVisits.animalId, animals.id))
      .where(whereClause)
      .orderBy(desc(vetVisits.date));

    return {
      visits: results as VetVisitReportRow[],
      total: results.length,
    };
  } catch (err) {
    console.error("getVetVisitsReport query failed:", err);
    return { visits: [], total: 0 };
  }
}

// ==================== R5: Medication Report ====================

export interface MedicationReportFilters {
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface MedicationReportRow {
  id: number;
  animalId: number;
  animalName: string;
  animalSpecies: string;
  medicationName: string;
  dosage: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
}

export interface MedicationReportResult {
  medications: MedicationReportRow[];
  total: number;
}

export async function getMedicationReport(
  filters: MedicationReportFilters,
): Promise<MedicationReportResult> {
  const { isActive, page, pageSize } = filters;

  const conditions = [];
  if (isActive !== undefined) conditions.push(eq(medications.isActive, isActive));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const selectFields = {
    id: medications.id,
    animalId: medications.animalId,
    animalName: animals.name,
    animalSpecies: animals.species,
    medicationName: medications.medicationName,
    dosage: medications.dosage,
    startDate: medications.startDate,
    endDate: medications.endDate,
    isActive: medications.isActive,
    notes: medications.notes,
  };

  try {
    if (page && pageSize) {
      const results = await db
        .select(selectFields)
        .from(medications)
        .innerJoin(animals, eq(medications.animalId, animals.id))
        .where(whereClause)
        .orderBy(asc(animals.name), desc(medications.startDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(medications)
        .where(whereClause);

      return {
        medications: results as MedicationReportRow[],
        total: (totalResult as { count: number }[])[0]?.count ?? 0,
      };
    }

    const results = await db
      .select(selectFields)
      .from(medications)
      .innerJoin(animals, eq(medications.animalId, animals.id))
      .where(whereClause)
      .orderBy(asc(animals.name), desc(medications.startDate));

    return {
      medications: results as MedicationReportRow[],
      total: results.length,
    };
  } catch (err) {
    console.error("getMedicationReport query failed:", err);
    return { medications: [], total: 0 };
  }
}

// ==================== R11: Vet Inspection Reports (filtered) ====================

export interface VetInspectionReportFilters {
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface VetInspectionReportResult {
  reports: VetInspectionReport[];
  total: number;
}

export async function getVetInspectionReportsFiltered(
  filters: VetInspectionReportFilters,
): Promise<VetInspectionReportResult> {
  const { dateFrom, dateTo, page, pageSize } = filters;

  const conditions = [];
  if (dateFrom) conditions.push(gte(vetInspectionReports.visitDate, dateFrom));
  if (dateTo) conditions.push(lte(vetInspectionReports.visitDate, dateTo));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    if (page && pageSize) {
      const results = await db
        .select()
        .from(vetInspectionReports)
        .where(whereClause)
        .orderBy(desc(vetInspectionReports.visitDate))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(vetInspectionReports)
        .where(whereClause);

      return {
        reports: results as VetInspectionReport[],
        total: (totalResult as { count: number }[])[0]?.count ?? 0,
      };
    }

    const results = await db
      .select()
      .from(vetInspectionReports)
      .where(whereClause)
      .orderBy(desc(vetInspectionReports.visitDate));

    return {
      reports: results as VetInspectionReport[],
      total: results.length,
    };
  } catch (err) {
    console.error("getVetInspectionReportsFiltered query failed:", err);
    return { reports: [], total: 0 };
  }
}
