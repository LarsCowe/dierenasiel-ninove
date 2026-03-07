import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdoptionCandidateById } from "@/lib/queries/adoption-candidates";
import KennismakingForm from "@/components/beheerder/adoptie/KennismakingForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function KennismakingPlanPage({ params }: Props) {
  const { id } = await params;
  const candidateId = parseInt(id, 10);

  if (isNaN(candidateId)) notFound();

  const candidate = await getAdoptionCandidateById(candidateId);
  if (!candidate) notFound();

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
        Kennismaking plannen
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Plan een kennismaking tussen {candidate.firstName} {candidate.lastName} en het dier.
      </p>

      <div className="mt-6">
        <KennismakingForm
          candidateId={candidate.id}
          candidateName={`${candidate.firstName} ${candidate.lastName}`}
          animalId={candidate.animalId ?? null}
        />
      </div>
    </div>
  );
}
