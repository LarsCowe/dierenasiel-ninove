import Link from "next/link";
import { getAdoptionCandidates } from "@/lib/queries/adoption-candidates";
import AdoptionCandidateList from "@/components/beheerder/adoptie/AdoptionCandidateList";

interface Props {
  searchParams: Promise<{ categorie?: string }>;
}

export default async function AdoptiePage({ searchParams }: Props) {
  const { categorie } = await searchParams;
  const validCategories = ["niet_weerhouden", "mogelijks", "goede_kandidaat"];
  const activeCategory = categorie && validCategories.includes(categorie) ? categorie : undefined;
  const candidates = await getAdoptionCandidates(activeCategory);

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

      <div className="mt-6">
        <AdoptionCandidateList candidates={candidates} activeCategory={activeCategory} />
      </div>
    </div>
  );
}
