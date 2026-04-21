"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { StrayCatCampaign, StrayCatCampaignInspection, ActionResult } from "@/types";
import {
  deployCagesAction,
  registerInspectionAction,
  completeCampaignAction,
  linkAnimalAction,
} from "@/lib/actions/stray-cat-campaigns";
import {
  CAMPAIGN_STATUS_LABELS,
  FIV_FELV_STATUSES,
  FIV_FELV_STATUS_LABELS,
  CAMPAIGN_OUTCOMES,
  CAMPAIGN_OUTCOME_LABELS,
  CAGE_NUMBERS,
} from "@/lib/constants";
import CampaignStatusBadge from "./CampaignStatusBadge";
import CampaignPhotoUpload from "./CampaignPhotoUpload";
import InspectionLogSection from "./InspectionLogSection";

interface Props {
  campaign: StrayCatCampaign;
  availableCats: { id: number; name: string }[];
  occupiedCages: Record<string, number>;
  inspections: StrayCatCampaignInspection[];
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p role="alert" className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

function ReadonlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || "—"}</dd>
    </div>
  );
}

// --- Kooi-uitzetting sectie ---
async function handleDeployCages(prev: ActionResult | null, formData: FormData) {
  return deployCagesAction({
    campaignId: Number(formData.get("campaignId")),
    cageDeploymentDate: formData.get("cageDeploymentDate") as string,
    cageNumbers: formData.get("cageNumbers") as string,
  });
}

function DeployCagesSection({
  campaignId,
  occupiedCages,
}: {
  campaignId: number;
  occupiedCages: Record<string, number>;
}) {
  const [state, formAction, isPending] = useActionState(handleDeployCages, null);
  const [selectedCages, setSelectedCages] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  const toggleCage = (num: string) => {
    setSelectedCages((prev) =>
      prev.includes(num) ? prev.filter((x) => x !== num) : [...prev, num],
    );
  };

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="cageNumbers" value={selectedCages.join(",")} />
      {state && !state.success && state.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</div>
      )}
      <div>
        <label htmlFor="cageDeploymentDate" className="block text-sm font-medium text-gray-700">
          Datum kooi-uitzetting *
        </label>
        <input
          type="date"
          id="cageDeploymentDate"
          name="cageDeploymentDate"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 sm:w-64"
        />
        <FieldError errors={(state && !state.success ? state.fieldErrors?.cageDeploymentDate : undefined) as string[] | undefined} />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Kooiennummers * <span className="text-xs font-normal text-gray-500">(meerdere mogelijk)</span>
          </label>
          <span className="text-xs text-gray-500">
            {selectedCages.length > 0 ? `${selectedCages.length} geselecteerd` : "Geen geselecteerd"}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {CAGE_NUMBERS.map((num) => {
            const occupiedBy = occupiedCages[num];
            const isOccupied = occupiedBy !== undefined;
            const isSelected = selectedCages.includes(num);
            return (
              <label
                key={num}
                title={isOccupied ? `In gebruik in campagne #${occupiedBy}` : undefined}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                  isOccupied
                    ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                    : isSelected
                      ? "border-amber-500 bg-amber-50 text-amber-900"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isOccupied}
                  onChange={() => toggleCage(num)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 disabled:cursor-not-allowed"
                />
                <span className="font-medium">{num}</span>
                {isOccupied && <span className="ml-auto text-xs">#{occupiedBy}</span>}
              </label>
            );
          })}
        </div>
        <FieldError errors={(state && !state.success ? state.fieldErrors?.cageNumbers : undefined) as string[] | undefined} />
      </div>
      <button
        type="submit"
        disabled={isPending || selectedCages.length === 0}
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {isPending ? "Bezig..." : "Kooien uitzetten"}
      </button>
    </form>
  );
}

// --- Inspectie sectie ---
async function handleInspection(prev: ActionResult | null, formData: FormData) {
  return registerInspectionAction({
    campaignId: Number(formData.get("campaignId")),
    inspectionDate: formData.get("inspectionDate") as string,
    catDescription: formData.get("catDescription") as string,
    vetName: formData.get("vetName") as string,
    cageAtVet: (formData.get("cageAtVet") as string) || "",
  });
}

function InspectionSection({ campaignId }: { campaignId: number }) {
  const [state, formAction, isPending] = useActionState(handleInspection, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="campaignId" value={campaignId} />
      {state && !state.success && state.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inspectionDate" className="block text-sm font-medium text-gray-700">
            Inspectiedatum *
          </label>
          <input
            type="date"
            id="inspectionDate"
            name="inspectionDate"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
          <FieldError errors={(state && !state.success ? state.fieldErrors?.inspectionDate : undefined) as string[] | undefined} />
        </div>
        <div>
          <label htmlFor="vetName" className="block text-sm font-medium text-gray-700">
            Dierenarts *
          </label>
          <input
            type="text"
            id="vetName"
            name="vetName"
            placeholder="Naam dierenarts"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
          <FieldError errors={(state && !state.success ? state.fieldErrors?.vetName : undefined) as string[] | undefined} />
        </div>
      </div>
      <div>
        <label htmlFor="catDescription" className="block text-sm font-medium text-gray-700">
          Katbeschrijving *
        </label>
        <textarea
          id="catDescription"
          name="catDescription"
          rows={2}
          placeholder="Bijv. Cyperse kater, ~2 jaar, geen chip"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
        <FieldError errors={(state && !state.success ? state.fieldErrors?.catDescription : undefined) as string[] | undefined} />
      </div>
      <div>
        <label htmlFor="cageAtVet" className="block text-sm font-medium text-gray-700">
          Kooi bij dierenarts
        </label>
        <input
          type="text"
          id="cageAtVet"
          name="cageAtVet"
          placeholder="Kooiennummer"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
        <FieldError errors={(state && !state.success ? state.fieldErrors?.cageAtVet : undefined) as string[] | undefined} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
      >
        {isPending ? "Bezig..." : "Inspectie registreren"}
      </button>
    </form>
  );
}

// --- Afronding sectie ---
async function handleComplete(prev: ActionResult | null, formData: FormData) {
  return completeCampaignAction({
    campaignId: Number(formData.get("campaignId")),
    fivStatus: formData.get("fivStatus") as "positief" | "negatief" | "niet_getest",
    felvStatus: formData.get("felvStatus") as "positief" | "negatief" | "niet_getest",
    outcome: formData.get("outcome") as "gecastreerd_uitgezet" | "gesteriliseerd_uitgezet" | "geadopteerd",
    remarks: (formData.get("remarks") as string) || "",
  });
}

function CompletionSection({ campaignId }: { campaignId: number }) {
  const [state, formAction, isPending] = useActionState(handleComplete, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="campaignId" value={campaignId} />
      {state && !state.success && state.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="fivStatus" className="block text-sm font-medium text-gray-700">
            FIV-status *
          </label>
          <select
            id="fivStatus"
            name="fivStatus"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="">Selecteer...</option>
            {FIV_FELV_STATUSES.map((s) => (
              <option key={s} value={s}>{FIV_FELV_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="felvStatus" className="block text-sm font-medium text-gray-700">
            FeLV-status *
          </label>
          <select
            id="felvStatus"
            name="felvStatus"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="">Selecteer...</option>
            {FIV_FELV_STATUSES.map((s) => (
              <option key={s} value={s}>{FIV_FELV_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="outcome" className="block text-sm font-medium text-gray-700">
            Uitkomst *
          </label>
          <select
            id="outcome"
            name="outcome"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="">Selecteer...</option>
            {CAMPAIGN_OUTCOMES.map((o) => (
              <option key={o} value={o}>{CAMPAIGN_OUTCOME_LABELS[o]}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
          Opmerkingen
        </label>
        <textarea
          id="remarks"
          name="remarks"
          rows={2}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {isPending ? "Bezig..." : "Campagne afronden"}
      </button>
    </form>
  );
}

// --- Dier koppelen sectie ---
function AnimalLinkSection({ campaignId, availableCats, currentLinkedAnimalId }: {
  campaignId: number;
  availableCats: { id: number; name: string }[];
  currentLinkedAnimalId: number | null;
}) {
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(currentLinkedAnimalId);
  const [state, setState] = useState<{ success?: boolean; error?: string } | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleLink() {
    if (!selectedAnimalId) return;
    setIsPending(true);
    const result = await linkAnimalAction({ campaignId, linkedAnimalId: selectedAnimalId });
    setState(result);
    setIsPending(false);
    if (result.success) router.refresh();
  }

  return (
    <div className="space-y-3">
      {state && !state.success && state.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</div>
      )}
      {state?.success && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Dier succesvol gekoppeld.</div>
      )}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="linkedAnimal" className="block text-sm font-medium text-gray-700">
            Koppel aan dier in systeem
          </label>
          <select
            id="linkedAnimal"
            value={selectedAnimalId ?? ""}
            onChange={(e) => setSelectedAnimalId(e.target.value ? Number(e.target.value) : null)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          >
            <option value="">Selecteer een kat...</option>
            {availableCats.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleLink}
          disabled={isPending || !selectedAnimalId}
          className="rounded-lg bg-[#1b4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Bezig..." : "Koppelen"}
        </button>
      </div>
    </div>
  );
}

// --- Hoofd component ---
export default function CampaignDetailForm({ campaign, availableCats, occupiedCages, inspections }: Props) {
  const statusOrder = ["open", "kooien_geplaatst", "in_behandeling", "afgerond"];
  const currentIndex = statusOrder.indexOf(campaign.status);

  return (
    <div className="space-y-6">
      {/* Status stappenbalk */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1b4332]">
            Campagne #{campaign.id}
          </h2>
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <div className="flex gap-1">
          {statusOrder.map((s, i) => (
            <div
              key={s}
              className={`flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium ${
                i <= currentIndex
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {CAMPAIGN_STATUS_LABELS[s as keyof typeof CAMPAIGN_STATUS_LABELS]}
            </div>
          ))}
        </div>
      </div>

      {/* Basisgegevens (altijd zichtbaar, readonly) */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Verzoekgegevens</h3>
        <dl className="grid gap-4 sm:grid-cols-3">
          <ReadonlyField label="Datum verzoek" value={campaign.requestDate} />
          <ReadonlyField label="Gemeente" value={campaign.municipality} />
          <ReadonlyField label="Adres" value={campaign.address} />
        </dl>
        {campaign.remarks && (
          <div className="mt-4">
            <ReadonlyField label="Opmerkingen" value={campaign.remarks} />
          </div>
        )}
      </div>

      {/* Foto */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Foto</h3>
        <CampaignPhotoUpload campaignId={campaign.id} currentPhotoUrl={campaign.photoUrl} />
      </div>

      {/* Kooi-uitzetting */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Kooi-uitzetting</h3>
        {campaign.status === "open" ? (
          <DeployCagesSection campaignId={campaign.id} occupiedCages={occupiedCages} />
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <ReadonlyField label="Datum kooi-uitzetting" value={campaign.cageDeploymentDate} />
            <ReadonlyField label="Kooiennummers" value={campaign.cageNumbers} />
          </dl>
        )}
      </div>

      {/* Inspectie-log (Story 10.9) — zichtbaar vanaf kooien_geplaatst, onafhankelijk van status-flow */}
      {currentIndex >= 1 && (
        <InspectionLogSection campaignId={campaign.id} inspections={inspections} />
      )}

      {/* Inspectie (alleen zichtbaar vanaf kooien_geplaatst) */}
      {currentIndex >= 1 && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Inspectie</h3>
          {campaign.status === "kooien_geplaatst" ? (
            <InspectionSection campaignId={campaign.id} />
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <ReadonlyField label="Inspectiedatum" value={campaign.inspectionDate} />
              <ReadonlyField label="Dierenarts" value={campaign.vetName} />
              <ReadonlyField label="Katbeschrijving" value={campaign.catDescription} />
              <ReadonlyField label="Kooi bij dierenarts" value={campaign.cageAtVet} />
            </dl>
          )}
        </div>
      )}

      {/* Medische resultaten & uitkomst (alleen zichtbaar vanaf in_behandeling) */}
      {currentIndex >= 2 && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Medische resultaten & uitkomst</h3>
          {campaign.status === "in_behandeling" ? (
            <CompletionSection campaignId={campaign.id} />
          ) : (
            <dl className="grid gap-4 sm:grid-cols-3">
              <ReadonlyField label="FIV-status" value={campaign.fivStatus ? FIV_FELV_STATUS_LABELS[campaign.fivStatus as keyof typeof FIV_FELV_STATUS_LABELS] : null} />
              <ReadonlyField label="FeLV-status" value={campaign.felvStatus ? FIV_FELV_STATUS_LABELS[campaign.felvStatus as keyof typeof FIV_FELV_STATUS_LABELS] : null} />
              <ReadonlyField label="Uitkomst" value={campaign.outcome ? CAMPAIGN_OUTCOME_LABELS[campaign.outcome as keyof typeof CAMPAIGN_OUTCOME_LABELS] : null} />
            </dl>
          )}
        </div>
      )}

      {/* Dier koppelen (alleen bij afgerond + uitkomst = geadopteerd) */}
      {campaign.status === "afgerond" && campaign.outcome === "geadopteerd" && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Dier koppeling</h3>
          <AnimalLinkSection
            campaignId={campaign.id}
            availableCats={availableCats}
            currentLinkedAnimalId={campaign.linkedAnimalId}
          />
        </div>
      )}
    </div>
  );
}
