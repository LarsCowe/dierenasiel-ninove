import Link from "next/link";
import { getAdoptionCandidates, getAnimalNameById } from "@/lib/queries/adoption-candidates";
import AdoptionCandidateList from "@/components/beheerder/adoptie/AdoptionCandidateList";

interface Props {
  searchParams: Promise<{ categorie?: string; animalId?: string }>;
}

export default async function AdoptiePage({ searchParams }: Props) {
  const { categorie, animalId } = await searchParams;
  const validCategories = ["niet_weerhouden", "mogelijks", "goede_kandidaat", "blanco"];
  const activeCategory = categorie && validCategories.includes(categorie) ? categorie : undefined;
  const parsedAnimalId = animalId && /^\d+$/.test(animalId) ? Number(animalId) : undefined;

  const [candidates, animalName] = await Promise.all([
    getAdoptionCandidates(activeCategory, parsedAnimalId),
    parsedAnimalId ? getAnimalNameById(parsedAnimalId) : Promise.resolve(null),
  ]);

  const filterHref = activeCategory ? `/beheerder/adoptie?categorie=${activeCategory}` : "/beheerder/adoptie";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
            Adoptie-aanvragen
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Overzicht van alle kandidaat-adoptanten en hun screeningstatus.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/beheerder/adoptie/zwarte-lijst"
            className="rounded-md border border-red-600 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Zwarte lijst
          </Link>
          <Link
            href="/beheerder/adoptie/opvolging"
            className="rounded-md border border-emerald-700 px-5 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Opvolgingen
          </Link>
          <Link
            href="/beheerder/adoptie/nieuw"
            className="rounded-md bg-[#1b4332] px-5 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f]"
          >
            Nieuwe aanvraag
          </Link>
        </div>
      </div>

      {parsedAnimalId && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900">
          <span>
            Aanvragen voor <strong>{animalName ?? `dier #${parsedAnimalId}`}</strong>
          </span>
          <Link href={filterHref} className="text-xs font-medium text-emerald-700 underline hover:text-emerald-900">
            Toon alle aanvragen
          </Link>
        </div>
      )}

      <div className="mt-6">
        <AdoptionCandidateList candidates={candidates} activeCategory={activeCategory} />
      </div>
    </div>
  );
}
