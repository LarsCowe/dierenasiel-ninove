"use client";

import { useRouter } from "next/navigation";
import type { StrayCatCampaign } from "@/types";
import CampaignStatusBadge from "@/components/beheerder/zwerfkatten/CampaignStatusBadge";

interface Props {
  campaigns: StrayCatCampaign[];
}

export default function ActiveStrayCatCampaigns({ campaigns }: Props) {
  const router = useRouter();

  const navigate = (href: string, event: React.MouseEvent | React.KeyboardEvent) => {
    const mouseEvent = event as React.MouseEvent;
    if (mouseEvent.ctrlKey || mouseEvent.metaKey || mouseEvent.button === 1) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(href);
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">🐾</span>
        <h3 className="font-heading text-sm font-bold text-[#1b4332]">
          Lopende zwerfkat-opdrachten
        </h3>
      </div>
      {campaigns.length === 0 ? (
        <p className="mt-4 text-center text-sm text-gray-400">
          Geen lopende opdrachten
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-50">
          {campaigns.map((campaign) => {
            const href = `/beheerder/dieren/zwerfkattenbeleid/${campaign.id}`;
            return (
              <li
                key={campaign.id}
                tabIndex={0}
                role="link"
                onClick={(e) => navigate(href, e)}
                onAuxClick={(e) => {
                  if (e.button === 1) navigate(href, e);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(href, e);
                  }
                }}
                className="flex cursor-pointer items-center gap-3 py-2.5 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-700">
                    {campaign.municipality}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {campaign.address}
                  </p>
                </div>
                <div className="shrink-0">
                  <CampaignStatusBadge status={campaign.status} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
