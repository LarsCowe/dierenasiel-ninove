import { notFound } from "next/navigation";
import Link from "next/link";
import { getWalkerById } from "@/lib/queries/walkers";
import WalkerDetailView from "@/components/beheerder/wandelaars/WalkerDetailView";
import WalkerStatusActions from "@/components/beheerder/wandelaars/WalkerStatusActions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WandelaarDetailPage({ params }: Props) {
  const { id } = await params;
  const walkerId = parseInt(id, 10);

  if (isNaN(walkerId)) notFound();

  const walker = await getWalkerById(walkerId);
  if (!walker) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link
          href="/beheerder/wandelaars"
          className="text-sm text-emerald-700 hover:text-emerald-900"
        >
          &larr; Terug naar overzicht
        </Link>
      </div>

      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        {walker.firstName} {walker.lastName}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Wandelaarprofiel
      </p>

      <div className="mt-6">
        <WalkerDetailView walker={walker} />
      </div>

      <div className="mt-6">
        <WalkerStatusActions walker={walker} />
      </div>
    </div>
  );
}
