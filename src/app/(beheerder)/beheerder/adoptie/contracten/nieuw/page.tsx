import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { adoptionCandidates, adoptionContracts, animals } from "@/lib/db/schema";
import { eq, notInArray } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";

export default async function NewContractPage() {
  const permCheck = await requirePermission("adoption:write");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder");
  }

  const existingContractCandidateIds = await db
    .select({ candidateId: adoptionContracts.candidateId })
    .from(adoptionContracts);

  const excludeIds = existingContractCandidateIds
    .map((r) => r.candidateId)
    .filter((id): id is number => id !== null);

  const candidates = await db
    .select({
      id: adoptionCandidates.id,
      firstName: adoptionCandidates.firstName,
      lastName: adoptionCandidates.lastName,
      email: adoptionCandidates.email,
      animalId: adoptionCandidates.animalId,
      animalName: animals.name,
      animalSpecies: animals.species,
    })
    .from(adoptionCandidates)
    .leftJoin(animals, eq(adoptionCandidates.animalId, animals.id))
    .where(
      excludeIds.length > 0
        ? notInArray(adoptionCandidates.id, excludeIds)
        : undefined,
    );

  const eligible = candidates.filter((c) => c.animalId !== null);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link
          href="/beheerder/adoptie?tab=contracten"
          className="text-sm text-emerald-700 hover:text-emerald-900"
        >
          &larr; Terug naar contracten
        </Link>
      </div>

      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">Nieuw contract</h1>
      <p className="mt-1 text-sm text-gray-500">
        Twee opties: vertrek vanuit een goedgekeurde adoptie-aanvraag, of maak rechtstreeks een contract aan.
      </p>

      {/* Optie B: rechtstreeks */}
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="font-heading text-sm font-bold text-emerald-900">Rechtstreeks contract</h2>
        <p className="mt-1 text-xs text-emerald-800">
          Maak een contract aan zonder gekoppelde adoptie-aanvraag. Handig voor walk-ins of contracten buiten de standaard-flow.
        </p>
        <Link
          href="/beheerder/adoptie/contracten/nieuw-direct"
          className="mt-3 inline-block rounded-md bg-[#1b4332] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2d6a4f]"
        >
          Rechtstreeks contract opmaken
        </Link>
      </div>

      {/* Optie A: vanuit kandidaat */}
      <div className="mt-6">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Vertrek vanuit aanvraag</h2>
        <p className="mt-1 text-xs text-gray-500">
          Goedgekeurde kandidaten zonder bestaand contract.
        </p>
        <div className="mt-3 rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
          {eligible.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              Geen kandidaten zonder contract beschikbaar.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {eligible.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Adopteert {c.animalName ?? "—"}{c.animalSpecies ? ` (${c.animalSpecies})` : ""} · {c.email}
                    </p>
                  </div>
                  <Link
                    href={`/beheerder/adoptie/${c.id}/contract`}
                    className="rounded-md bg-[#1b4332] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2d6a4f]"
                  >
                    Contract opmaken
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
