import Link from "next/link";
import { getAdoptionCandidates, getAnimalNameById } from "@/lib/queries/adoption-candidates";
import { getContractsList } from "@/lib/queries/adoption-contracts";
import AdoptionCandidateList from "@/components/beheerder/adoptie/AdoptionCandidateList";
import AdoptionContractList from "@/components/beheerder/adoptie/AdoptionContractList";
import AdoptionContractFilter from "@/components/beheerder/adoptie/AdoptionContractFilter";
import AdoptieTabs from "@/components/beheerder/adoptie/AdoptieTabs";

interface Props {
  searchParams: Promise<{
    tab?: string;
    categorie?: string;
    animalId?: string;
    status?: string;
    zoek?: string;
  }>;
}

export default async function AdoptiePage({ searchParams }: Props) {
  const params = await searchParams;
  const activeTab = params.tab === "contracten" ? "contracten" : "aanvragen";

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1b4332]">Adoptie</h1>
        <p className="mt-1 text-sm text-gray-500">
          Beheer adoptie-aanvragen en contracten.
        </p>
      </div>

      <div className="mt-6">
        <AdoptieTabs active={activeTab} />
      </div>

      <div className="mt-6">
        {activeTab === "aanvragen" ? (
          <AanvragenTab params={params} />
        ) : (
          <ContractenTab params={params} />
        )}
      </div>
    </div>
  );
}

async function AanvragenTab({ params }: { params: { categorie?: string; animalId?: string } }) {
  const validCategories = ["niet_weerhouden", "mogelijks", "goede_kandidaat", "blanco"];
  const activeCategory =
    params.categorie && validCategories.includes(params.categorie) ? params.categorie : undefined;
  const parsedAnimalId =
    params.animalId && /^\d+$/.test(params.animalId) ? Number(params.animalId) : undefined;

  const [candidates, animalName] = await Promise.all([
    getAdoptionCandidates(activeCategory, parsedAnimalId),
    parsedAnimalId ? getAnimalNameById(parsedAnimalId) : Promise.resolve(null),
  ]);

  const filterHref = activeCategory
    ? `/beheerder/adoptie?tab=aanvragen&categorie=${activeCategory}`
    : "/beheerder/adoptie?tab=aanvragen";

  return (
    <div className="space-y-4">
      {parsedAnimalId && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
          <span>
            Aanvragen voor <strong>{animalName ?? `dier #${parsedAnimalId}`}</strong>
          </span>
          <Link href={filterHref} className="text-xs font-medium text-emerald-700 underline hover:text-emerald-900">
            Toon alle aanvragen
          </Link>
        </div>
      )}

      <AdoptionCandidateList candidates={candidates} activeCategory={activeCategory} />
    </div>
  );
}

async function ContractenTab({ params }: { params: { status?: string; zoek?: string } }) {
  const contracts = await getContractsList({
    status: params.status,
    search: params.zoek,
  });

  return (
    <div className="space-y-4">
      <AdoptionContractFilter />
      <AdoptionContractList contracts={contracts} />
    </div>
  );
}
