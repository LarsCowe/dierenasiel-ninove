import Link from "next/link";
import { getPlannedFollowupsForOverview } from "@/lib/queries/post-adoption-followups";
import PostAdoptionFollowupList from "@/components/beheerder/adoptie/PostAdoptionFollowupList";

export default async function OpvolgingOverviewPage() {
  const rows = await getPlannedFollowupsForOverview();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4">
        <Link
          href="/beheerder/adoptie"
          className="text-sm text-emerald-700 hover:text-emerald-900"
        >
          &larr; Terug naar adoptie
        </Link>
      </div>

      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        Post-adoptie opvolgingen
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Alle geplande opvolgingen — bel de adoptant en registreer het resultaat.
      </p>

      <PostAdoptionFollowupList rows={rows} />
    </div>
  );
}
