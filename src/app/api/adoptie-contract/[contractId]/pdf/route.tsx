import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { adoptionContracts, adoptionCandidates, animals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import AdoptionContractPdf from "@/components/beheerder/adoptie/AdoptionContractPdf";
import type { ContractData } from "@/components/beheerder/adoptie/AdoptionContractPdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const { contractId } = await params;
  const id = parseInt(contractId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Ongeldig contract ID" }, { status: 400 });
  }

  // Fetch contract + candidate + animal
  const [contract] = await db
    .select()
    .from(adoptionContracts)
    .where(eq(adoptionContracts.id, id))
    .limit(1);

  if (!contract) {
    return NextResponse.json({ error: "Contract niet gevonden" }, { status: 404 });
  }

  // Story 10.20+: snapshot is leidend; fallback naar candidate/animal voor oude
  // contracten zonder snapshot of voor missing fields.
  const [candidate] = contract.candidateId
    ? await db
        .select()
        .from(adoptionCandidates)
        .where(eq(adoptionCandidates.id, contract.candidateId))
        .limit(1)
    : [];

  const [animal] = await db
    .select()
    .from(animals)
    .where(eq(animals.id, contract.animalId))
    .limit(1);

  if (!animal) {
    return NextResponse.json({ error: "Dier niet gevonden" }, { status: 404 });
  }

  const qa = (candidate?.questionnaireAnswers ?? {}) as Record<string, unknown>;

  const contractData: ContractData = {
    contractDate: new Date(contract.contractDate).toLocaleDateString("nl-BE"),
    contractNr: String(contract.id),
    // Adoptant — snapshot eerst, dan candidate, dan leeg.
    firstName: contract.snapshotAdoptantFirstName ?? candidate?.firstName ?? "",
    lastName: contract.snapshotAdoptantLastName ?? candidate?.lastName ?? "",
    address: contract.snapshotAdoptantAddress ?? candidate?.address ?? "",
    dateOfBirth:
      contract.snapshotAdoptantBirthDate ??
      (typeof qa.geboortedatum === "string" ? qa.geboortedatum : ""),
    rijksregister:
      contract.snapshotAdoptantIdNumber ??
      (typeof qa.rijksregister === "string" ? qa.rijksregister : ""),
    phone: contract.snapshotAdoptantPhone ?? candidate?.phone ?? "",
    email: contract.snapshotAdoptantEmail ?? candidate?.email ?? "",
    // Dier — snapshot eerst, dan animal-record.
    animalName: contract.snapshotAnimalName ?? animal.name,
    species: contract.snapshotAnimalSpecies ?? animal.species,
    breed: contract.snapshotAnimalBreed ?? animal.breed ?? "",
    animalDateOfBirth:
      contract.snapshotAnimalBirthDate ??
      (animal.dateOfBirth ? new Date(animal.dateOfBirth).toLocaleDateString("nl-BE") : ""),
    identificationNr: contract.snapshotAnimalChipNr ?? animal.identificationNr ?? "",
    gender: contract.snapshotAnimalGender ?? animal.gender ?? "",
    isNeutered: contract.snapshotAnimalNeutered ?? animal.isNeutered ?? false,
    color: contract.snapshotAnimalColor ?? animal.color ?? "",
    passportNr: contract.snapshotAnimalPassportNr ?? animal.passportNr ?? "",
    description: contract.snapshotAnimalDescription ?? animal.description ?? "",
    // Contract
    paymentAmount: contract.paymentAmount,
    paymentMethod: contract.paymentMethod,
    notes: contract.notes ?? "",
  };

  const buffer = await renderToBuffer(
    <AdoptionContractPdf data={contractData} />,
  );

  const speciesLabel = animal.species === "hond"
    ? "hond"
    : animal.species === "kat"
      ? "kat"
      : "andere";
  const filename = `adoptiecontract-${speciesLabel}-${animal.name}-${candidate.lastName}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
