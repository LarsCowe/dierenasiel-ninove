import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdoptionCandidateById } from "@/lib/queries/adoption-candidates";
import { getAnimalById } from "@/lib/queries/animals";
import AdoptionContractForm from "@/components/beheerder/adoptie/AdoptionContractForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ContractPage({ params }: Props) {
  const { id } = await params;
  const candidateId = parseInt(id, 10);

  if (isNaN(candidateId)) notFound();

  const candidate = await getAdoptionCandidateById(candidateId);
  if (!candidate) notFound();
  if (candidate.status !== "approved") notFound();

  const animal = await getAnimalById(candidate.animalId);
  if (!animal) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <Link
          href={`/beheerder/adoptie/${candidate.id}`}
          className="text-sm text-emerald-700 hover:text-emerald-900"
        >
          &larr; Terug naar kandidaat
        </Link>
      </div>

      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        Adoptiecontract opmaken
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Bijlage VIII C — {candidate.firstName} {candidate.lastName} adopteert {animal.name}
      </p>

      <div className="mt-6">
        <AdoptionContractForm
          candidateId={candidate.id}
          candidateName={`${candidate.firstName} ${candidate.lastName}`}
          animalId={animal.id}
          animalName={animal.name}
        />
      </div>
    </div>
  );
}
