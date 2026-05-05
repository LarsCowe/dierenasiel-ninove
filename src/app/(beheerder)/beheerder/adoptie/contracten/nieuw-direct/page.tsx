import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { adoptionCandidates, adoptionContracts, animals } from "@/lib/db/schema";
import { eq, and, asc, isNotNull, notInArray, desc } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import DirectContractForm from "@/components/beheerder/adoptie/DirectContractForm";

export default async function NewDirectContractPage() {
  const permCheck = await requirePermission("adoption:write");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder");
  }

  // Toon enkel dieren die nog in het asiel zijn (kandidaten voor adoptie).
  const animalRows = await db
    .select({
      id: animals.id,
      name: animals.name,
      species: animals.species,
      breed: animals.breed,
      birthDate: animals.dateOfBirth,
      gender: animals.gender,
      color: animals.color,
      identificationNr: animals.identificationNr,
      passportNr: animals.passportNr,
      description: animals.description,
      isNeutered: animals.isNeutered,
    })
    .from(animals)
    .where(and(eq(animals.isInShelter, true)))
    .orderBy(asc(animals.name));

  // Story 10.20+: kandidaten zonder bestaand contract per dier ophalen, zodat
  // bij dier-selectie de adoptant-gegevens automatisch ingevuld kunnen worden.
  const existingContractCandidateIds = await db
    .select({ candidateId: adoptionContracts.candidateId })
    .from(adoptionContracts);
  const excludeIds = existingContractCandidateIds
    .map((r) => r.candidateId)
    .filter((id): id is number => id !== null);

  const candidateRows = await db
    .select({
      id: adoptionCandidates.id,
      animalId: adoptionCandidates.animalId,
      firstName: adoptionCandidates.firstName,
      lastName: adoptionCandidates.lastName,
      email: adoptionCandidates.email,
      phone: adoptionCandidates.phone,
      address: adoptionCandidates.address,
      questionnaireAnswers: adoptionCandidates.questionnaireAnswers,
      status: adoptionCandidates.status,
      createdAt: adoptionCandidates.createdAt,
    })
    .from(adoptionCandidates)
    .where(
      and(
        isNotNull(adoptionCandidates.animalId),
        excludeIds.length > 0
          ? notInArray(adoptionCandidates.id, excludeIds)
          : undefined,
      ),
    )
    .orderBy(desc(adoptionCandidates.createdAt));

  // Map per dier
  const candidatesByAnimal = new Map<number, Array<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    dateOfBirth: string;
    rijksregister: string;
    status: string;
  }>>();
  for (const c of candidateRows) {
    if (!c.animalId) continue;
    const qa = (c.questionnaireAnswers ?? {}) as Record<string, unknown>;
    const list = candidatesByAnimal.get(c.animalId) ?? [];
    list.push({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      dateOfBirth: typeof qa.geboortedatum === "string" ? qa.geboortedatum : "",
      rijksregister: typeof qa.rijksregister === "string" ? qa.rijksregister : "",
      status: c.status,
    });
    candidatesByAnimal.set(c.animalId, list);
  }

  const options = animalRows.map((a) => ({
    id: a.id,
    name: a.name,
    species: a.species ?? "",
    breed: a.breed ?? "",
    birthDate: a.birthDate ?? "",
    gender: a.gender ?? "",
    color: a.color ?? "",
    identificationNr: a.identificationNr ?? "",
    passportNr: a.passportNr ?? "",
    description: a.description ?? "",
    isNeutered: a.isNeutered ?? false,
    candidates: candidatesByAnimal.get(a.id) ?? [],
  }));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link
          href="/beheerder/adoptie/contracten/nieuw"
          className="text-sm text-emerald-700 hover:text-emerald-900"
        >
          &larr; Terug
        </Link>
      </div>

      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        Rechtstreeks contract opmaken
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Geen gekoppelde adoptie-aanvraag — vul alle adoptant- en diergegevens manueel in.
      </p>

      <div className="mt-6">
        <DirectContractForm animals={options} />
      </div>
    </div>
  );
}
