import Link from "next/link";
import { getAllCampaigns } from "@/lib/queries/stray-cat-campaigns";
import CampaignTable from "@/components/beheerder/zwerfkatten/CampaignTable";

export default async function ZwerfkattenbeleidPage() {
  const campaigns = await getAllCampaigns();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
            Zwerfkattenbeleid
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {campaigns.length} campagne{campaigns.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/beheerder/dieren/zwerfkattenbeleid/nieuw"
          className="rounded-lg bg-[#1b4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f]"
        >
          + Nieuw verzoek
        </Link>
      </div>

      <CampaignTable campaigns={campaigns} />
    </div>
  );
}
