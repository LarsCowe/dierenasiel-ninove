import { getWalkersForAdmin, getWalkingClubMembers, getNearThresholdWalkers } from "@/lib/queries/walkers";
import { getActiveWalksForAdmin, getLastWalkDates } from "@/lib/queries/walks";
import { getWalkingClubThreshold } from "@/lib/queries/shelter-settings";
import Link from "next/link";
import WalkerList from "@/components/beheerder/wandelaars/WalkerList";
import ActiveWalksPanel from "@/components/beheerder/wandelaars/ActiveWalksPanel";
import WandelclubPanel from "@/components/beheerder/wandelaars/WandelclubPanel";
import WalkerCreateButton from "@/components/beheerder/wandelaars/WalkerCreateButton";

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function WandelaarsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const validStatuses = ["pending", "approved", "rejected", "inactive"];
  const activeStatus = status && validStatuses.includes(status) ? status : undefined;

  const [walkers, activeWalks, threshold, clubMembers] = await Promise.all([
    getWalkersForAdmin(activeStatus),
    getActiveWalksForAdmin(),
    getWalkingClubThreshold(),
    getWalkingClubMembers(),
  ]);

  const nearThreshold = await getNearThresholdWalkers(threshold);

  // Get last walk dates for all relevant walkers (AC4)
  const allWalkerIds = [
    ...clubMembers.map((m) => m.id),
    ...nearThreshold.map((w) => w.id),
  ];
  const lastWalkDatesMap = await getLastWalkDates(allWalkerIds);
  const lastWalkDates: Record<number, string> = {};
  for (const [id, date] of lastWalkDatesMap) {
    lastWalkDates[id] = date;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
            Wandelaars
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Overzicht van alle geregistreerde wandelaars en hun status.
          </p>
        </div>
        <WalkerCreateButton />
      </div>

      {/* Active walks panel (Story 5.4 AC5, Story 5.7 AC1) */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-[#1b4332]">
            Actieve wandelingen ({activeWalks.length})
          </h2>
          <Link
            href="/beheerder/wandelaars/actief"
            className="text-sm font-medium text-[#2d6a4f] hover:underline"
          >
            Volledig overzicht &rarr;
          </Link>
        </div>
        <ActiveWalksPanel walks={activeWalks} />
      </section>

      {/* Wandelclub section (Story 5.6 AC2) */}
      <section className="mt-8">
        <h2 className="mb-3 font-heading text-lg font-semibold text-[#1b4332]">
          Wandelclub
        </h2>
        <WandelclubPanel
          members={clubMembers}
          nearThreshold={nearThreshold}
          threshold={threshold}
          lastWalkDates={lastWalkDates}
        />
      </section>

      <div className="mt-8">
        <WalkerList walkers={walkers} activeStatus={activeStatus} />
      </div>
    </div>
  );
}
