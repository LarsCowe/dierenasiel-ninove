import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdoptionCandidateById } from "@/lib/queries/adoption-candidates";
import { getKennismakingenByCandidateId } from "@/lib/queries/kennismakingen";
import { getContractByCandidateId } from "@/lib/queries/adoption-contracts";
import { getFollowupsByContractId } from "@/lib/queries/post-adoption-followups";
import { getAnimalById } from "@/lib/queries/animals";
import AdoptionCandidateView from "@/components/beheerder/adoptie/AdoptionCandidateView";
import KennismakingList from "@/components/beheerder/adoptie/KennismakingList";
import AdoptionContractInfo from "@/components/beheerder/adoptie/AdoptionContractInfo";
import FollowupList from "@/components/beheerder/adoptie/FollowupList";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdoptieKandidaatDetailPage({ params }: Props) {
  const { id } = await params;
  const candidateId = parseInt(id, 10);

  if (isNaN(candidateId)) notFound();

  const [candidate, kennismakingen, contract] = await Promise.all([
    getAdoptionCandidateById(candidateId),
    getKennismakingenByCandidateId(candidateId),
    getContractByCandidateId(candidateId),
  ]);
  if (!candidate) notFound();

  const animal = candidate.animalId ? await getAnimalById(candidate.animalId) : null;

  const followups = contract ? await getFollowupsByContractId(contract.id) : [];

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
        <AdoptionCandidateView
          candidate={candidate}
          animalName={animal?.name}
          kennismakingenSlot={
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="font-heading text-sm font-bold text-[#1b4332]">Kennismakingen</h2>
              <div className="mt-3">
                <KennismakingList kennismakingen={kennismakingen} />
              </div>
            </div>
          }
        />
      </div>

      {/* Contract info + DogID/CatID overdracht toggle (Story 4.5) */}
      {contract && (
        <div className="mt-6">
          <AdoptionContractInfo contract={contract} />
        </div>
      )}

      {/* Post-adoptie opvolgingen (Story 4.6) */}
      {contract && (
        <div className="mt-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <FollowupList followups={followups} contractId={contract.id} />
        </div>
      )}
    </div>
  );
}
