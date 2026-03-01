import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { getCampaignReport, getDistinctMunicipalities } from "@/lib/queries/stray-cat-campaigns";
import { CAMPAIGN_OUTCOME_LABELS, FIV_FELV_STATUS_LABELS } from "@/lib/constants";
import DateRangeFilter from "@/components/beheerder/rapporten/DateRangeFilter";
import ReportExportBar from "@/components/beheerder/rapporten/ReportExportBar";
import CampaignStatusBadge from "@/components/beheerder/zwerfkatten/CampaignStatusBadge";
import { exportStrayCatCsvWrapper } from "./actions";
import GemeenteFilter from "./GemeenteFilter";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ZwerfkattenRapportPage({ searchParams }: Props) {
  const permCheck = await requirePermission("report:read");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder");
  }

  const params = await searchParams;

  const municipality = typeof params.gemeente === "string" ? params.gemeente : undefined;
  const dateFrom = typeof params.van === "string" ? params.van : undefined;
  const dateTo = typeof params.tot === "string" ? params.tot : undefined;

  const [{ campaigns, stats }, municipalities] = await Promise.all([
    getCampaignReport({ municipality, dateFrom, dateTo }),
    getDistinctMunicipalities(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/beheerder/rapporten"
            className="text-sm text-emerald-700 hover:text-emerald-800"
          >
            &larr; Terug naar rapporten
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            R14 — Zwerfkattenbeleid
          </h1>
          <p className="text-sm text-gray-500">{stats.total} campagnes</p>
        </div>
        <Suspense>
          <ReportExportBar
            csvAction={exportStrayCatCsvWrapper}
            pdfUrl="/api/rapporten/zwerfkatten/pdf"
            filenamePrefix="zwerfkatten"
          />
        </Suspense>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-16 animate-pulse rounded-lg bg-gray-100" />}>
        <div className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4">
          <DateRangeFilter />
          <GemeenteFilter municipalities={municipalities} />
        </div>
      </Suspense>

      {/* Statistieken */}
      {stats.total > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Samenvatting</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Totaal campagnes" value={stats.total} />
            <StatCard label="Afgeronde campagnes" value={stats.completedCampaigns} />
            <StatCard label="FIV positief" value={`${stats.fivPositive} (${stats.fivPercentage}%)`} />
            <StatCard label="FeLV positief" value={`${stats.felvPositive} (${stats.felvPercentage}%)`} />
          </div>
          {Object.keys(stats.outcomes).length > 0 && (
            <div className="grid gap-4 sm:grid-cols-3">
              {Object.entries(stats.outcomes).map(([key, count]) => (
                <StatCard
                  key={key}
                  label={CAMPAIGN_OUTCOME_LABELS[key as keyof typeof CAMPAIGN_OUTCOME_LABELS] ?? key}
                  value={count}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail tabel */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Datum</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Gemeente</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Adres</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">FIV</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">FeLV</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Uitkomst</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  Geen campagnes gevonden voor deze filters.
                </td>
              </tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">{campaign.requestDate}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{campaign.municipality}</td>
                  <td className="max-w-xs truncate px-4 py-2 text-sm text-gray-600">{campaign.address}</td>
                  <td className="px-4 py-2 text-sm">
                    <CampaignStatusBadge status={campaign.status} />
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{campaign.fivStatus ? (FIV_FELV_STATUS_LABELS[campaign.fivStatus as keyof typeof FIV_FELV_STATUS_LABELS] ?? campaign.fivStatus) : "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{campaign.felvStatus ? (FIV_FELV_STATUS_LABELS[campaign.felvStatus as keyof typeof FIV_FELV_STATUS_LABELS] ?? campaign.felvStatus) : "-"}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {campaign.outcome
                      ? CAMPAIGN_OUTCOME_LABELS[campaign.outcome as keyof typeof CAMPAIGN_OUTCOME_LABELS] ?? campaign.outcome
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#1b4332]">{value}</p>
    </div>
  );
}
