import { getWalkersForAdmin } from "@/lib/queries/walkers";
import { getActiveWalksForAdmin } from "@/lib/queries/walks";
import WalkerList from "@/components/beheerder/wandelaars/WalkerList";
import ActiveWalksPanel from "@/components/beheerder/wandelaars/ActiveWalksPanel";

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function WandelaarsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const validStatuses = ["pending", "approved", "rejected", "inactive"];
  const activeStatus = status && validStatuses.includes(status) ? status : undefined;

  const [walkers, activeWalks] = await Promise.all([
    getWalkersForAdmin(activeStatus),
    getActiveWalksForAdmin(),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
          Wandelaars
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Overzicht van alle geregistreerde wandelaars en hun status.
        </p>
      </div>

      {/* Active walks panel (AC5) */}
      <section className="mt-6">
        <h2 className="mb-3 font-heading text-lg font-semibold text-[#1b4332]">
          Actieve wandelingen ({activeWalks.length})
        </h2>
        <ActiveWalksPanel walks={activeWalks} />
      </section>

      <div className="mt-8">
        <WalkerList walkers={walkers} activeStatus={activeStatus} />
      </div>
    </div>
  );
}
