"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setCampaignLogoAction } from "@/lib/actions/stray-cat-campaigns";
import type { MunicipalityLogo } from "@/types";

interface Props {
  campaignId: number;
  currentLogoId: number | null;
  logos: MunicipalityLogo[];
}

export default function MunicipalityLogoPicker({ campaignId, currentLogoId, logos }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(currentLogoId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = logos.find((l) => l.id === selectedId) ?? null;

  function onChange(value: string) {
    const next = value ? Number(value) : null;
    setSelectedId(next);
    setError(null);
    startTransition(async () => {
      const res = await setCampaignLogoAction(campaignId, next);
      if (!res.success) {
        setError(res.error ?? "Logo koppelen mislukt");
        setSelectedId(currentLogoId);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Logo gemeente
        </h3>
        <Link
          href="/beheerder/dieren/zwerfkattenbeleid/logos"
          className="text-xs text-emerald-700 hover:underline"
        >
          Logo's beheren →
        </Link>
      </div>
      {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {logos.length === 0 ? (
        <p className="text-sm text-gray-400">
          Nog geen logo's in de bibliotheek.
        </p>
      ) : (
        <div className="flex items-center gap-4">
          <select
            value={selectedId ?? ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={isPending}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50"
          >
            <option value="">— Geen logo —</option>
            {logos.map((logo) => (
              <option key={logo.id} value={logo.id}>{logo.name}</option>
            ))}
          </select>
          {selected && (
            <Image
              src={selected.logoUrl}
              alt={selected.name}
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 rounded border border-gray-200 object-contain"
            />
          )}
        </div>
      )}
    </div>
  );
}
