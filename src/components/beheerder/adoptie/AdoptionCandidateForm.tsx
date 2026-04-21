"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createAdoptionCandidate } from "@/lib/actions/adoption-candidates";
import AdoptionAnimalSelector from "./AdoptionAnimalSelector";
import type { Animal } from "@/types";

interface Props {
  availableAnimals: Pick<Animal, "id" | "name" | "species" | "identificationNr">[];
}

type SubmitResult = Awaited<ReturnType<typeof createAdoptionCandidate>>;

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p role="alert" className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

export default function AdoptionCandidateForm({ availableAnimals }: Props) {
  const router = useRouter();
  const [animalId, setAnimalId] = useState<number>(0);
  // Alle velden zijn controlled. De form gebruikt onSubmit i.p.v. <form action={...}>
  // om React 19's post-action DOM-reset op <input>/<select> te vermijden (zie story 10.2).
  const [personal, setPersonal] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [questionnaire, setQuestionnaire] = useState({
    woonsituatie: "",
    tuinOmheind: null as boolean | null,
    eerderHuisdieren: false,
    huidigeHuisdieren: "",
    kinderenInHuis: "geen",
    werkSituatie: "",
    uurAlleen: "",
    ervaring: "",
    motivatie: "",
    opmerkingen: "",
  });
  const [state, setState] = useState<SubmitResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateP = <K extends keyof typeof personal>(key: K, value: string) => {
    setPersonal((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        firstName: personal.firstName,
        lastName: personal.lastName,
        email: personal.email,
        phone: personal.phone || undefined,
        address: personal.address || undefined,
        animalId,
        questionnaireAnswers: questionnaire,
        notes: personal.notes || undefined,
      };
      const fd = new FormData();
      fd.append("json", JSON.stringify(payload));

      const result = await createAdoptionCandidate(null, fd);
      setState(result);
      if (result.success) {
        router.push(`/beheerder/adoptie/${result.data.id}`);
      }
    });
  };

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const globalError = state && !state.success ? state.error : undefined;
  const hasFieldErrors = fieldErrors && Object.keys(fieldErrors).length > 0;
  const questionnaireErrors = fieldErrors?.questionnaireAnswers as string[] | undefined;
  const animalIdErrors = fieldErrors?.animalId as string[] | undefined;

  // Per-veld foutdetectie voor questionnaire: Zod's flatten() geeft enkel een top-level
  // questionnaireAnswers-fout, niet per sub-veld. We markeren alleen de verplichte velden
  // die effectief leeg zijn — correct ingevulde velden blijven groen, ook na een failed submit.
  const woonsituatieError = Boolean(questionnaireErrors) && !questionnaire.woonsituatie;
  const werkSituatieError = Boolean(questionnaireErrors) && !questionnaire.werkSituatie;
  const motivatieError = Boolean(questionnaireErrors) && !questionnaire.motivatie;

  const updateQ = <K extends keyof typeof questionnaire>(key: K, value: (typeof questionnaire)[K]) => {
    setQuestionnaire((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-800">{globalError}</p>
        </div>
      )}
      {!globalError && hasFieldErrors && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-800">
            Niet alle verplichte velden zijn correct ingevuld. Controleer het formulier.
          </p>
        </div>
      )}

      {/* Persoonlijke gegevens */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Persoonlijke gegevens</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className={`block text-xs font-medium ${fieldErrors?.firstName ? "text-red-700" : "text-gray-600"}`}>
              Voornaam <span className="text-red-500">*</span>
            </label>
            <input type="text" id="firstName" name="firstName" value={personal.firstName} onChange={(e) => updateP("firstName", e.target.value)} required aria-invalid={!!fieldErrors?.firstName} className={`mt-0.5 block w-full rounded-md border ${fieldErrors?.firstName ? "border-red-500" : "border-gray-300"} px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500`} />
            <FieldError errors={fieldErrors?.firstName} />
          </div>
          <div>
            <label htmlFor="lastName" className={`block text-xs font-medium ${fieldErrors?.lastName ? "text-red-700" : "text-gray-600"}`}>
              Achternaam <span className="text-red-500">*</span>
            </label>
            <input type="text" id="lastName" name="lastName" value={personal.lastName} onChange={(e) => updateP("lastName", e.target.value)} required aria-invalid={!!fieldErrors?.lastName} className={`mt-0.5 block w-full rounded-md border ${fieldErrors?.lastName ? "border-red-500" : "border-gray-300"} px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500`} />
            <FieldError errors={fieldErrors?.lastName} />
          </div>
          <div>
            <label htmlFor="email" className={`block text-xs font-medium ${fieldErrors?.email ? "text-red-700" : "text-gray-600"}`}>
              E-mailadres <span className="text-red-500">*</span>
            </label>
            <input type="email" id="email" name="email" value={personal.email} onChange={(e) => updateP("email", e.target.value)} required aria-invalid={!!fieldErrors?.email} className={`mt-0.5 block w-full rounded-md border ${fieldErrors?.email ? "border-red-500" : "border-gray-300"} px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500`} />
            <FieldError errors={fieldErrors?.email} />
          </div>
          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-gray-600">Telefoon</label>
            <input type="tel" id="phone" name="phone" value={personal.phone} onChange={(e) => updateP("phone", e.target.value)} className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-xs font-medium text-gray-600">Adres</label>
            <input type="text" id="address" name="address" value={personal.address} onChange={(e) => updateP("address", e.target.value)} className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500" />
          </div>
        </div>
      </div>

      {/* Dier selectie */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Gewenst dier</h2>
        <p className="mt-1 text-xs text-gray-500">Enkel dieren die beschikbaar zijn voor adoptie worden getoond (FR-07).</p>
        <div className="mt-3">
          <AdoptionAnimalSelector
            animals={availableAnimals}
            selectedAnimalId={animalId || undefined}
            onSelect={setAnimalId}
          />
          <FieldError errors={animalIdErrors} />
        </div>
      </div>

      {/* Vragenlijst Bijlage IX */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Vragenlijst (Bijlage IX)</h2>
        <p className="mt-1 text-xs text-gray-500">Verplichte screening volgens KB 27/04/2007.</p>
        {questionnaireErrors && (
          <p className="mt-2 text-sm text-red-600">Vul alle verplichte vragenlijst-velden in (woonsituatie, werksituatie, motivatie).</p>
        )}
        <div className="mt-3 space-y-4">
          <div>
            <label className={`block text-xs font-medium ${woonsituatieError ? "text-red-700" : "text-gray-600"}`}>
              Woonsituatie <span className="text-red-500">*</span>
            </label>
            <select value={questionnaire.woonsituatie} onChange={(e) => updateQ("woonsituatie", e.target.value)} aria-invalid={woonsituatieError} className={`mt-0.5 block w-full rounded-md border ${woonsituatieError ? "border-red-500" : "border-gray-300"} px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500`}>
              <option value="">Selecteer...</option>
              <option value="huis_met_tuin">Huis met tuin</option>
              <option value="appartement">Appartement</option>
              <option value="boerderij">Boerderij</option>
              <option value="andere">Andere</option>
            </select>
          </div>

          {questionnaire.woonsituatie === "huis_met_tuin" && (
            <div>
              <label className="block text-xs font-medium text-gray-600">Is de tuin omheind?</label>
              <select value={questionnaire.tuinOmheind === null ? "" : questionnaire.tuinOmheind ? "ja" : "nee"} onChange={(e) => updateQ("tuinOmheind", e.target.value === "" ? null : e.target.value === "ja")} className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500">
                <option value="">Onbekend</option>
                <option value="ja">Ja</option>
                <option value="nee">Nee</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="eerderHuisdieren" checked={questionnaire.eerderHuisdieren} onChange={(e) => updateQ("eerderHuisdieren", e.target.checked)} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
            <label htmlFor="eerderHuisdieren" className="text-xs font-medium text-gray-600">Eerder huisdieren gehad</label>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">Huidige huisdieren</label>
            <input type="text" value={questionnaire.huidigeHuisdieren} onChange={(e) => updateQ("huidigeHuisdieren", e.target.value)} placeholder="Bijv. 1 kat, 2 konijnen" className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">
              Kinderen in huis <span className="text-red-500">*</span>
            </label>
            <select value={questionnaire.kinderenInHuis} onChange={(e) => updateQ("kinderenInHuis", e.target.value)} className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500">
              <option value="geen">Geen kinderen</option>
              <option value="0_5">0-5 jaar</option>
              <option value="6_12">6-12 jaar</option>
              <option value="12_plus">12+ jaar</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-medium ${werkSituatieError ? "text-red-700" : "text-gray-600"}`}>
              Werksituatie <span className="text-red-500">*</span>
            </label>
            <select value={questionnaire.werkSituatie} onChange={(e) => updateQ("werkSituatie", e.target.value)} aria-invalid={werkSituatieError} className={`mt-0.5 block w-full rounded-md border ${werkSituatieError ? "border-red-500" : "border-gray-300"} px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500`}>
              <option value="">Selecteer...</option>
              <option value="voltijds_thuis">Voltijds thuis</option>
              <option value="deeltijds">Deeltijds</option>
              <option value="voltijds_buitenshuis">Voltijds buitenshuis</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">Uren alleen per dag</label>
            <input type="text" value={questionnaire.uurAlleen} onChange={(e) => updateQ("uurAlleen", e.target.value)} placeholder="Bijv. 4 uur" className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">Ervaring met dieren</label>
            <textarea rows={3} value={questionnaire.ervaring} onChange={(e) => updateQ("ervaring", e.target.value)} placeholder="Beschrijf uw ervaring met huisdieren..." className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500" />
          </div>

          <div>
            <label className={`block text-xs font-medium ${motivatieError ? "text-red-700" : "text-gray-600"}`}>
              Motivatie <span className="text-red-500">*</span>
            </label>
            <textarea rows={3} value={questionnaire.motivatie} onChange={(e) => updateQ("motivatie", e.target.value)} placeholder="Waarom wilt u dit dier adopteren?" aria-invalid={motivatieError} className={`mt-0.5 block w-full rounded-md border ${motivatieError ? "border-red-500" : "border-gray-300"} px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500`} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">Opmerkingen</label>
            <textarea rows={2} value={questionnaire.opmerkingen} onChange={(e) => updateQ("opmerkingen", e.target.value)} placeholder="Eventuele extra opmerkingen..." className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500" />
          </div>
        </div>
      </div>

      {/* Notities */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Interne notities</h2>
        <div className="mt-3">
          <textarea name="notes" rows={3} value={personal.notes} onChange={(e) => updateP("notes", e.target.value)} placeholder="Notities voor het team..." className="block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500" />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-[#1b4332] px-6 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Opslaan..." : "Aanvraag registreren"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/beheerder/adoptie")}
          className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}
