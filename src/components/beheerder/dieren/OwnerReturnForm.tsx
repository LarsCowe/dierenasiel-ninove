"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createOwnerReturnForm } from "@/lib/actions/owner-return";
import type { AnimalSnapshotFields } from "@/lib/animals/owner-return";
import type { OwnerReturnFormInput } from "@/lib/validations/owner-return";
import { SPECIES_LABELS } from "@/lib/constants";

/**
 * Story 10.64 — het invulscherm voor "Terug naar eigenaar", in de volgorde van
 * Sven's papieren formulier. De diergegevens komen van de fiche maar blijven
 * bewerkbaar ("gegevens dier zal manueel moeten"); de eigenaar dicteert de rest.
 */

interface Props {
  animalId: number;
  prefill: AnimalSnapshotFields;
  /** JJJJ-MM-DD, van de server — zo klopt de dag ook 's nachts (Brussel vs UTC). */
  today: string;
}

type Veld = keyof OwnerReturnFormInput;
type VeldFouten = Partial<Record<string, string[]>>;

const INPUT =
  "mt-0.5 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500";
const LABEL = "block text-xs font-medium text-gray-600";

const STANDAARD_PLAATS = "Denderwindeke";

// Tailwind ziet enkel letterlijke klassen; een samengestelde `sm:col-span-${n}` bestaat niet.
const SPAN: Record<2 | 3 | 6, string> = { 2: "sm:col-span-2", 3: "sm:col-span-3", 6: "sm:col-span-6" };

function Fout({ veld, fouten }: { veld: Veld; fouten?: VeldFouten }) {
  const f = fouten?.[veld];
  return f ? <p className="mt-1 text-sm text-red-600">{f[0]}</p> : null;
}

interface TekstProps {
  veld: Veld;
  label: string;
  waarde: string;
  fouten?: VeldFouten;
  type?: string;
  span?: 2 | 3 | 6;
  placeholder?: string;
  verplicht?: boolean;
}

function Tekst({ veld, label, waarde, fouten, type = "text", span = 3, placeholder, verplicht }: TekstProps) {
  return (
    <div className={SPAN[span]}>
      <label htmlFor={veld} className={LABEL}>
        {label} {verplicht && <span className="text-red-500">*</span>}
      </label>
      <input id={veld} name={veld} type={type} defaultValue={waarde} className={INPUT} placeholder={placeholder} />
      <Fout veld={veld} fouten={fouten} />
    </div>
  );
}

interface KeuzeProps {
  veld: Veld;
  label: string;
  waarde: string;
  fouten?: VeldFouten;
  opties: { value: string; label: string }[];
}

/** Twee vakjes zoals op het papier, plus "onbekend" (= niets aangekruist). */
function Keuze({ veld, label, waarde, fouten, opties }: KeuzeProps) {
  return (
    <div className={SPAN[3]}>
      <span className={LABEL}>{label}</span>
      <div className="mt-1 flex gap-4">
        {opties.map((o) => (
          <label key={o.value} className="inline-flex items-center gap-1.5 text-sm">
            <input type="radio" name={veld} value={o.value} defaultChecked={waarde === o.value} />
            {o.label}
          </label>
        ))}
        <label className="inline-flex items-center gap-1.5 text-sm text-gray-500">
          <input type="radio" name={veld} value="" defaultChecked={waarde === ""} />
          onbekend
        </label>
      </div>
      <Fout veld={veld} fouten={fouten} />
    </div>
  );
}

/** Keuzelijst met de Nederlandse namen; een soort buiten de lijst blijft kiesbaar. */
function Soort({ waarde, fouten }: { waarde: string; fouten?: VeldFouten }) {
  const opties = Object.entries(SPECIES_LABELS);
  if (waarde && !(waarde in SPECIES_LABELS)) opties.push([waarde, waarde]);
  return (
    <div className={SPAN[3]}>
      <label htmlFor="animalSpecies" className={LABEL}>
        Diersoort
      </label>
      <select id="animalSpecies" name="animalSpecies" defaultValue={waarde} className={INPUT}>
        <option value="">—</option>
        {opties.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <Fout veld="animalSpecies" fouten={fouten} />
    </div>
  );
}

export default function OwnerReturnForm({ animalId, prefill, today }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createOwnerReturnForm, null);

  useEffect(() => {
    if (state?.success) {
      router.push(`/beheerder/dieren/${animalId}/terug-naar-eigenaar/${state.data.id}`);
    }
  }, [state, router, animalId]);

  const fouten = state && !state.success ? state.fieldErrors : undefined;
  const globalError = state && !state.success ? state.error : undefined;
  // React 19 zet het formulier na een server action terug op zijn beginwaarden, ook bij
  // een fout. De action stuurt de ingevulde waarden terug; `key` laat ze opnieuw landen.
  const terug = state && !state.success ? state.values : undefined;

  const begin: Record<string, string> = { drawnUpOn: today, drawnUpAt: STANDAARD_PLAATS, ...prefill };
  const w = (veld: Veld) => terug?.[veld] ?? begin[veld] ?? "";

  return (
    <form key={JSON.stringify(terug ?? {})} action={formAction} noValidate className="space-y-6">
      <input type="hidden" name="animalId" value={animalId} />
      {globalError && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {globalError}
        </p>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow">
        <div className="grid gap-3 sm:grid-cols-6">
          <Tekst veld="drawnUpOn" label="Opgemaakt op" type="date" verplicht waarde={w("drawnUpOn")} fouten={fouten} />
          <Tekst veld="drawnUpAt" label="Opgemaakt te" waarde={w("drawnUpAt")} fouten={fouten} />
        </div>
        <p className="mt-2 text-xs text-gray-500">Het volgnummer wordt bij het opslaan toegekend.</p>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow">
        <h2 className="mb-3 text-sm font-bold text-[#1b4332]">Eigenaar</h2>
        <div className="grid gap-3 sm:grid-cols-6">
          <Tekst veld="ownerLastName" label="Familienaam" verplicht waarde={w("ownerLastName")} fouten={fouten} />
          <Tekst veld="ownerFirstName" label="Voornaam" verplicht waarde={w("ownerFirstName")} fouten={fouten} />
          <Tekst veld="ownerStreet" label="Straat en nummer" span={6} waarde={w("ownerStreet")} fouten={fouten} />
          <Tekst veld="ownerPostalCode" label="Postcode" span={2} waarde={w("ownerPostalCode")} fouten={fouten} />
          <Tekst veld="ownerCity" label="Gemeente" span={2} waarde={w("ownerCity")} fouten={fouten} />
          <Tekst veld="ownerCountry" label="Land" span={2} placeholder="leeg = België" waarde={w("ownerCountry")} fouten={fouten} />
          <Tekst veld="ownerBirthDate" label="Geboortedatum" type="date" waarde={w("ownerBirthDate")} fouten={fouten} />
          <Tekst veld="ownerBirthPlace" label="Geboorteplaats" waarde={w("ownerBirthPlace")} fouten={fouten} />
          <Tekst veld="ownerPhone" label="Telefoon" type="tel" span={2} waarde={w("ownerPhone")} fouten={fouten} />
          <Tekst veld="ownerMobile" label="Gsm" type="tel" span={2} waarde={w("ownerMobile")} fouten={fouten} />
          <Tekst veld="ownerEmail" label="E-mail" type="email" span={2} placeholder="voor de kopie van het formulier" waarde={w("ownerEmail")} fouten={fouten} />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow">
        <h2 className="mb-1 text-sm font-bold text-[#1b4332]">Gegevens van het dier</h2>
        <p className="mb-3 text-xs text-gray-500">
          Overgenomen van de fiche. Pas aan wat op het formulier anders moet staan; de fiche zelf verandert niet.
        </p>
        <div className="grid gap-3 sm:grid-cols-6">
          <Tekst veld="animalName" label="Naam" verplicht waarde={w("animalName")} fouten={fouten} />
          <Soort waarde={w("animalSpecies")} fouten={fouten} />
          <Tekst veld="animalBreed" label="Ras" waarde={w("animalBreed")} fouten={fouten} />
          <Tekst veld="animalBirthDate" label="Geboortedatum" type="date" waarde={w("animalBirthDate")} fouten={fouten} />
          <Tekst veld="animalIdentificationNr" label="Identificatienr (chip)" waarde={w("animalIdentificationNr")} fouten={fouten} />
          <Tekst veld="animalPassportNr" label="Nr paspoort en/of vaccinatieboekje" waarde={w("animalPassportNr")} fouten={fouten} />
          <Keuze veld="animalGender" label="Geslacht" waarde={w("animalGender")} fouten={fouten} opties={[{ value: "M", label: "M" }, { value: "V", label: "V" }]} />
          <Keuze veld="animalNeutered" label="Gesteriliseerd" waarde={w("animalNeutered")} fouten={fouten} opties={[{ value: "ja", label: "Ja" }, { value: "nee", label: "Nee" }]} />
          <Keuze veld="animalPedigree" label="Stamboom" waarde={w("animalPedigree")} fouten={fouten} opties={[{ value: "ja", label: "Ja" }, { value: "nee", label: "Nee" }]} />
          <div className={SPAN[6]}>
            <label htmlFor="animalCoatDescription" className={LABEL}>
              Beschrijving van de vacht en eventuele bijzondere kenmerken
            </label>
            <textarea
              id="animalCoatDescription"
              name="animalCoatDescription"
              rows={3}
              maxLength={5000}
              defaultValue={w("animalCoatDescription")}
              className={INPUT}
            />
            <Fout veld="animalCoatDescription" fouten={fouten} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow">
        <h2 className="mb-3 text-sm font-bold text-[#1b4332]">Bijdrage in de kosten</h2>
        <div className="grid gap-3 sm:grid-cols-6">
          <Tekst veld="stayCosts" label="Verblijfskosten" placeholder="bijv. 3 dagen × 15 €" waarde={w("stayCosts")} fouten={fouten} />
          <Tekst veld="totalPaid" label="Totaal betaald bedrag (€)" placeholder="bijv. 45,00" waarde={w("totalPaid")} fouten={fouten} />
        </div>
      </section>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push(`/beheerder/dieren/${animalId}`)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-[#1b4332] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Opslaan..." : "Opslaan en verder"}
        </button>
      </div>
    </form>
  );
}
