"use client";

import Image from "next/image";
import type { StrayCatCampaign, MunicipalityLogo } from "@/types";
import { CAMPAIGN_OUTCOME_LABELS } from "@/lib/constants";
import { useClickableRow } from "@/lib/hooks/useClickableRow";
import CampaignStatusBadge from "./CampaignStatusBadge";

interface Props {
  campaigns: StrayCatCampaign[];
  logoById?: Record<number, MunicipalityLogo>;
}

function CampaignRow({
  campaign,
  logoById,
}: {
  campaign: StrayCatCampaign;
  logoById: Record<number, MunicipalityLogo>;
}) {
  const rowProps = useClickableRow(`/beheerder/dieren/zwerfkattenbeleid/${campaign.id}`, {
    ariaLabel: `Bekijk campagne ${campaign.municipality} ${campaign.requestDate}`,
  });
  return (
    <tr
      {...rowProps}
      className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500"
    >
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-[#1b4332]">
        {campaign.requestDate}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          {campaign.municipalityLogoId && logoById[campaign.municipalityLogoId] && (
            <Image
              src={logoById[campaign.municipalityLogoId].logoUrl}
              alt={logoById[campaign.municipalityLogoId].name}
              width={24}
              height={24}
              unoptimized
              className="h-6 w-6 shrink-0 rounded object-contain"
            />
          )}
          <span>{campaign.municipality}</span>
        </div>
      </td>
      <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-700">{campaign.address}</td>
      <td className="px-4 py-3 text-sm">
        <CampaignStatusBadge status={campaign.status} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {campaign.outcome
          ? CAMPAIGN_OUTCOME_LABELS[campaign.outcome as keyof typeof CAMPAIGN_OUTCOME_LABELS] ?? campaign.outcome
          : "—"}
      </td>
    </tr>
  );
}

export default function CampaignTable({ campaigns, logoById = {} }: Props) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">Geen campagnes gevonden.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Datum verzoek</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Gemeente</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Adres</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Uitkomst</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {campaigns.map((campaign) => (
            <CampaignRow key={campaign.id} campaign={campaign} logoById={logoById} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
