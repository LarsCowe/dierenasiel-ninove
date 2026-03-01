"use server";

import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { getAnimalReport, getMedicationReport, getAdoptionContractsReport, getWebsitePublicationReport, getWalkActivityReport, getWalkerAnimalPairingsReport, getWorkflowOverviewReport, type AnimalReportFilters, type MedicationReportFilters, type MedicationReportRow, type AdoptionContractReportFilters, type AdoptionContractReportRow, type WalkActivityReportFilters, type WalkActivityReportRow, type WalkerAnimalPairingsReportFilters, type WalkerAnimalPairingRow, type WorkflowOverviewReportFilters, type WorkflowOverviewReportRow } from "@/lib/queries/reports";
import { getCampaignReport, type CampaignReportFilters } from "@/lib/queries/stray-cat-campaigns";
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_OUTCOME_LABELS, FIV_FELV_STATUS_LABELS } from "@/lib/constants";
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

// ==================== R9: Walk Activity CSV ====================

function walkActivityToCsvRow(walk: WalkActivityReportRow): string {
  return [
    escapeCsvField(walk.date),
    escapeCsvField(`${walk.walkerFirstName} ${walk.walkerLastName}`),
    escapeCsvField(walk.animalName),
    escapeCsvField(walk.startTime),
    escapeCsvField(walk.endTime ?? ""),
    walk.durationMinutes?.toString() ?? "",
    escapeCsvField(walk.remarks ?? ""),
  ].join(",");
}

export async function exportWalkActivityCsv(
  filters: Omit<WalkActivityReportFilters, "page" | "pageSize">,
): Promise<ActionResult<string>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "U bent niet ingelogd." };
  }

  if (!hasPermission(session.role, "report:generate")) {
    return { success: false, error: "Onvoldoende rechten voor rapport export." };
  }

  const { walks } = await getWalkActivityReport({ ...filters });

  const header = "Datum,Wandelaar,Hond,Start,Einde,Duur (min),Opmerkingen";
  const rows = walks.map(walkActivityToCsvRow);
  const csv = [header, ...rows].join("\n");

  return { success: true, data: csv };
}

// ==================== R10: Walker-Animal Pairings CSV ====================

function pairingToCsvRow(pairing: WalkerAnimalPairingRow): string {
  return [
    escapeCsvField(`${pairing.walkerFirstName} ${pairing.walkerLastName}`),
    escapeCsvField(pairing.animalName),
    pairing.walkCount.toString(),
    escapeCsvField(pairing.lastWalkDate),
  ].join(",");
}

export async function exportWalkerAnimalPairingsCsv(
  filters: WalkerAnimalPairingsReportFilters,
): Promise<ActionResult<string>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "U bent niet ingelogd." };
  }

  if (!hasPermission(session.role, "report:generate")) {
    return { success: false, error: "Onvoldoende rechten voor rapport export." };
  }

  const { pairings } = await getWalkerAnimalPairingsReport(filters);

  const header = "Wandelaar,Hond,Aantal wandelingen,Laatste wandeling";
  const rows = pairings.map(pairingToCsvRow);
  const csv = [header, ...rows].join("\n");

  return { success: true, data: csv };
}

// ==================== R13: Workflow Overview CSV ====================

function workflowRowToCsvRow(row: WorkflowOverviewReportRow): string {
  return [
    escapeCsvField(row.name),
    escapeCsvField(speciesLabel(row.species)),
    escapeCsvField(PHASE_LABELS[row.workflowPhase ?? ""] ?? row.workflowPhase ?? "-"),
    escapeCsvField(row.intakeDate ?? ""),
    row.daysSinceIntake?.toString() ?? "",
  ].join(",");
}

export async function exportWorkflowOverviewCsv(
  filters: Omit<WorkflowOverviewReportFilters, "page" | "pageSize">,
): Promise<ActionResult<string>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "U bent niet ingelogd." };
  }

  if (!hasPermission(session.role, "report:generate")) {
    return { success: false, error: "Onvoldoende rechten voor rapport export." };
  }

  const { animals } = await getWorkflowOverviewReport({ ...filters });

  const header = "Naam,Soort,Fase,Intakedatum,Dagen in asiel";
  const rows = animals.map(workflowRowToCsvRow);
  const csv = [header, ...rows].join("\n");

  return { success: true, data: csv };
}

function campaignToCsvRow(campaign: import("@/types").StrayCatCampaign): string {
  const statusLbl = CAMPAIGN_STATUS_LABELS[campaign.status as keyof typeof CAMPAIGN_STATUS_LABELS] ?? campaign.status;
  const fivLabel = campaign.fivStatus ? (FIV_FELV_STATUS_LABELS[campaign.fivStatus as keyof typeof FIV_FELV_STATUS_LABELS] ?? campaign.fivStatus) : "";
  const felvLabel = campaign.felvStatus ? (FIV_FELV_STATUS_LABELS[campaign.felvStatus as keyof typeof FIV_FELV_STATUS_LABELS] ?? campaign.felvStatus) : "";
  const outcomeLabel = campaign.outcome ? (CAMPAIGN_OUTCOME_LABELS[campaign.outcome as keyof typeof CAMPAIGN_OUTCOME_LABELS] ?? campaign.outcome) : "";

  return [
    escapeCsvField(campaign.requestDate),
    escapeCsvField(campaign.municipality),
    escapeCsvField(campaign.address),
    escapeCsvField(statusLbl),
    escapeCsvField(campaign.cageNumbers ?? ""),
    escapeCsvField(campaign.inspectionDate ?? ""),
    escapeCsvField(campaign.catDescription ?? ""),
    escapeCsvField(fivLabel),
    escapeCsvField(felvLabel),
    escapeCsvField(outcomeLabel),
    escapeCsvField(campaign.remarks ?? ""),
  ].join(",");
}

export async function exportStrayCatCampaignsCsv(
  filters: CampaignReportFilters,
): Promise<ActionResult<string>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "U bent niet ingelogd." };
  }

  if (!hasPermission(session.role, "report:generate")) {
    return { success: false, error: "Onvoldoende rechten voor rapport export." };
  }

  const { campaigns } = await getCampaignReport(filters);

  const header = "Datum verzoek,Gemeente,Adres,Status,Kooi nummers,Inspectiedatum,Kat beschrijving,FIV,FeLV,Uitkomst,Opmerkingen";
  const rows = campaigns.map(campaignToCsvRow);
  const csv = [header, ...rows].join("\n");

  return { success: true, data: csv };
}
