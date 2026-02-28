import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdoptionCandidateById } from "@/lib/queries/adoption-candidates";
import { getKennismakingenByCandidateId } from "@/lib/queries/kennismakingen";
import AdoptionCandidateView from "@/components/beheerder/adoptie/AdoptionCandidateView";
import KennismakingList from "@/components/beheerder/adoptie/KennismakingList";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdoptieKandidaatDetailPage({ params }: Props) {
  const { id } = await params;
  const candidateId = parseInt(id, 10);

  if (isNaN(candidateId)) notFound();

  const [candidate, kennismakingen] = await Promise.all([
    getAdoptionCandidateById(candidateId),
    getKennismakingenByCandidateId(candidateId),
  ]);
  if (!candidate) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link
          href="/beheerder/adoptie"
          className="text-sm text-emerald-700 hover:text-emerald-900"
        >
          &larr; Terug naar overzicht
        </Link>
      </div>

      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        {candidate.firstName} {candidate.lastName}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Adoptie-aanvraag
      </p>

      <div className="mt-6">
        <AdoptionCandidateView candidate={candidate} />
      </div>

      {/* Kennismakingshistorie (AC3) */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Kennismakingen</h2>
        <div className="mt-3">
          <KennismakingList kennismakingen={kennismakingen} />
        </div>
      </div>
    </div>
  );
}
