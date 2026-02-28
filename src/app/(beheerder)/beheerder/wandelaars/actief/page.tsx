import { getActiveWalksForAdmin } from "@/lib/queries/walks";
import ActiveWalksPanel from "@/components/beheerder/wandelaars/ActiveWalksPanel";
import Link from "next/link";

export default async function ActieveWandelingenPage() {
  const activeWalks = await getActiveWalksForAdmin();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
            Actieve Wandelingen
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Realtime overzicht van alle lopende wandelingen.
          </p>
        </div>
        <Link
          href="/beheerder/wandelaars"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Terug naar wandelaars
        </Link>
      </div>

      <section className="mt-6">
        <ActiveWalksPanel walks={activeWalks} />
      </section>
    </div>
  );
}
