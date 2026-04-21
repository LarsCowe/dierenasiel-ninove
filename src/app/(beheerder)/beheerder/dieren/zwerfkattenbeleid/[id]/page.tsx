import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampaignById, getCatsAvailableForLinking, getOccupiedCageNumbers, getInspectionsForCampaign } from "@/lib/queries/stray-cat-campaigns";
import CampaignDetailForm from "@/components/beheerder/zwerfkatten/CampaignDetailForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params;
  const campaignId = Number(id);
  if (isNaN(campaignId)) notFound();

  const [campaign, availableCats, occupiedCages, inspections] = await Promise.all([
    getCampaignById(campaignId),
    getCatsAvailableForLinking(),
    getOccupiedCageNumbers(campaignId),
    getInspectionsForCampaign(campaignId),
  ]);

  if (!campaign) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
          Campagne — {campaign.municipality}
        </h1>
        <Link
          href="/beheerder/dieren/zwerfkattenbeleid"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Terug naar overzicht
        </Link>
      </div>

      <CampaignDetailForm
        campaign={campaign}
        availableCats={availableCats}
        occupiedCages={occupiedCages}
        inspections={inspections}
      />
    </div>
  );
}
