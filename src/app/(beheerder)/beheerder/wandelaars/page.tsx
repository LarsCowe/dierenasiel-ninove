import { getWalkersForAdmin } from "@/lib/queries/walkers";
import WalkerList from "@/components/beheerder/wandelaars/WalkerList";

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function WandelaarsPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const validStatuses = ["pending", "approved", "rejected", "inactive"];
  const activeStatus = status && validStatuses.includes(status) ? status : undefined;
  const walkers = await getWalkersForAdmin(activeStatus);

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

      <div className="mt-6">
        <WalkerList walkers={walkers} activeStatus={activeStatus} />
      </div>
    </div>
  );
}
