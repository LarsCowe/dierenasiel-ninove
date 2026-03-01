"use server";

import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { getAnimalReport, getMedicationReport, getAdoptionContractsReport, getWebsitePublicationReport, type AnimalReportFilters, type MedicationReportFilters, type MedicationReportRow, type AdoptionContractReportFilters, type AdoptionContractReportRow } from "@/lib/queries/reports";
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

// ==================== R3: Adoption Contracts CSV ====================

function contractToCsvRow(contract: AdoptionContractReportRow): string {
  return [
    escapeCsvField(contract.animalName),
    escapeCsvField(speciesLabel(contract.animalSpecies)),
    escapeCsvField(`${contract.candidateFirstName} ${contract.candidateLastName}`),
    contract.contractDate,
    contract.paymentAmount,
    escapeCsvField(contract.paymentMethod),
    contract.dogidCatidTransferred ? "Ja" : "Nee",
  ].join(",");
}

interface AdoptionContractExportFilters {
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
}

export async function exportAdoptionContractsCsv(
  filters: AdoptionContractExportFilters,
): Promise<ActionResult<string>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Je bent niet ingelogd." };
  }

  if (!hasPermission(session.role, "report:generate")) {
    return { success: false, error: "Onvoldoende rechten voor rapport export." };
  }

  const queryFilters: AdoptionContractReportFilters = {};
  if (filters.dateFrom) queryFilters.dateFrom = filters.dateFrom;
  if (filters.dateTo) queryFilters.dateTo = filters.dateTo;
  if (filters.paymentMethod) queryFilters.paymentMethod = filters.paymentMethod;

  const { contracts } = await getAdoptionContractsReport(queryFilters);

  const header = "Dier,Soort,Adoptant,Datum,Bedrag,Betaalwijze,DogID/CatID overgedragen";
  const rows = contracts.map(contractToCsvRow);
  const csv = [header, ...rows].join("\n");

  return { success: true, data: csv };
}

// ==================== R7: Website Publication CSV ====================

function websiteAnimalToCsvRow(animal: Animal): string {
  return [
    escapeCsvField(animal.name),
    escapeCsvField(speciesLabel(animal.species)),
    escapeCsvField(animal.breed ?? ""),
    escapeCsvField(genderLabel(animal.gender)),
    escapeCsvField(animal.identificationNr ?? ""),
    escapeCsvField(animal.shortDescription ?? ""),
  ].join(",");
}

export async function exportWebsitePublicationCsv(): Promise<ActionResult<string>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Je bent niet ingelogd." };
  }

  if (!hasPermission(session.role, "report:generate")) {
    return { success: false, error: "Onvoldoende rechten voor rapport export." };
  }

  const { animals } = await getWebsitePublicationReport({});

  const header = "Naam,Soort,Ras,Geslacht,Chipnr,Korte beschrijving";
  const rows = animals.map(websiteAnimalToCsvRow);
  const csv = [header, ...rows].join("\n");

  return { success: true, data: csv };
}
