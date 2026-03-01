"use server";

import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { getAnimalReport, getMedicationReport, type AnimalReportFilters, type MedicationReportFilters, type MedicationReportRow } from "@/lib/queries/reports";
import { speciesLabel, genderLabel, statusLabel, escapeCsvField } from "@/lib/utils";
import { PHASE_LABELS } from "@/lib/workflow/stepbar";
import type { ActionResult } from "@/types";
import type { Animal } from "@/types";

function animalToCsvRow(animal: Animal): string {
  return [
    escapeCsvField(animal.name),
    escapeCsvField(speciesLabel(animal.species)),
    escapeCsvField(animal.breed ?? ""),
    escapeCsvField(genderLabel(animal.gender)),
    escapeCsvField(statusLabel(animal.status ?? "")),
    escapeCsvField(animal.workflowPhase ? (PHASE_LABELS[animal.workflowPhase] ?? animal.workflowPhase) : ""),
    escapeCsvField(animal.identificationNr ?? ""),
    animal.intakeDate ?? "",
  ].join(",");
}

interface ExportFilters {
  species?: string;
  status?: string;
  kennelId?: number;
  workflowPhase?: string;
}

export async function exportAnimalReportCsv(
  filters: ExportFilters,
): Promise<ActionResult<string>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Je bent niet ingelogd." };
  }

  if (!hasPermission(session.role, "report:generate")) {
    return { success: false, error: "Onvoldoende rechten voor rapport export." };
  }

  // Query without pagination — get all results for export
  const queryFilters: AnimalReportFilters = {};
  if (filters.species) queryFilters.species = filters.species;
  if (filters.status) queryFilters.status = filters.status;
  if (filters.kennelId) queryFilters.kennelId = filters.kennelId;
  if (filters.workflowPhase) queryFilters.workflowPhase = filters.workflowPhase;

  const { animals } = await getAnimalReport(queryFilters);

  const header = "Naam,Soort,Ras,Geslacht,Status,Workflow-fase,Chipnr,Intake datum";
  const rows = animals.map(animalToCsvRow);
  const csv = [header, ...rows].join("\n");

  return { success: true, data: csv };
}

// ==================== R5: Medication Report CSV ====================

function medicationToCsvRow(med: MedicationReportRow): string {
  return [
    escapeCsvField(med.animalName),
    escapeCsvField(speciesLabel(med.animalSpecies)),
    escapeCsvField(med.medicationName),
    escapeCsvField(med.dosage),
    med.startDate,
    med.endDate ?? "",
    med.isActive ? "Actief" : "Afgerond",
    escapeCsvField(med.notes ?? ""),
  ].join(",");
}

interface MedicationExportFilters {
  isActive?: boolean;
}

export async function exportMedicationReportCsv(
  filters: MedicationExportFilters,
): Promise<ActionResult<string>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Je bent niet ingelogd." };
  }

  if (!hasPermission(session.role, "report:generate")) {
    return { success: false, error: "Onvoldoende rechten voor rapport export." };
  }

  const queryFilters: MedicationReportFilters = {};
  if (filters.isActive !== undefined) queryFilters.isActive = filters.isActive;

  const { medications } = await getMedicationReport(queryFilters);

  const header = "Dier,Soort,Medicatie,Dosering,Startdatum,Einddatum,Status,Opmerkingen";
  const rows = medications.map(medicationToCsvRow);
  const csv = [header, ...rows].join("\n");

  return { success: true, data: csv };
}
