"use client";

import { useActionState, useState, useCallback } from "react";
import { submitSurrenderRequest } from "@/lib/actions/surrender";
import type { SurrenderResult } from "@/lib/actions/surrender";
import AdoptionPhotoUpload from "@/components/adoptie/AdoptionPhotoUpload";

// --- Question types ---
interface RadioQuestion {
  type: "radio";
  key: string;
  label: string;
  options: string[];
  allowOther?: boolean;
  required?: boolean;
}
interface TextQuestion {
  type: "text";
  key: string;
  label: string;
  required?: boolean;
}
interface CheckboxQuestion {
  type: "checkbox";
  key: string;
  label: string;
  options: string[];
  required?: boolean;
}
type Question = RadioQuestion | TextQuestion | CheckboxQuestion;

interface Section {
  title: string;
  questions: Question[];
}

const INFO_DIER_QUESTIONS: Question[] = [
  { type: "text", key: "naamDier", label: "Naam van het dier?", required: true },
  {
    type: "radio",
    key: "heeftPaspoort",
    label: "Beschikt het dier over een paspoort?",
    options: ["Ja", "Nee"],
    required: true,
  },
  { type: "text", key: "paspoortnummer", label: "Vul het paspoortnummer in?" },
  {
    type: "radio",
    key: "heeftChip",
    label: "Heeft het dier een identificatie chip?",
    options: ["Ja", "Nee"],
    required: true,
  },
  { type: "text", key: "chipnummer", label: "Wat is het chipnummer?" },
  {
    type: "radio",
    key: "chipOpNaam",
    label: "Is deze chip op u geregistreerd?",
    options: ["Ja", "Nee"],
    required: true,
  },
  { type: "text", key: "ras", label: "Welk ras is het dier?", required: true },
  {
    type: "text",
    key: "geboortedatum",
    label: "Hoe oud is het dier? (geboortedatum)",
    required: true,
  },
  {
    type: "radio",
    key: "geslacht",
    label: "Wat is het geslacht van het dier?",
    options: ["Mannelijk", "Vrouwelijk"],
    required: true,
  },
  {
    type: "radio",
    key: "gesteriliseerd",
    label: "Werd het dier gesteriliseerd/gecastreerd?",
    options: ["Ja", "Nee"],
  },
  {
    type: "radio",
    key: "laatsteDierenarts",
    label: "Wanneer werd er met het dier naar de dierenarts gegaan?",
    options: [
      "Nooit",
      "voorbije maand",
      "tussen een maand en 6 maand geleden",
      "tussen 6 maand en 1 jaar geleden",
      "tussen 1 jaar en 2 jaar geleden",
      "langer dan 2 jaar geleden",
    ],
    required: true,
  },
  {
    type: "text",
    key: "behandelendeDierenarts",
    label: "Wie is de behandelende dierenarts? (naam, adres en telefoon)",
  },
  {
    type: "radio",
    key: "goedeGezondheid",
    label: "Is het dier in een goede gezondheid?",
    options: ["Ja", "Neen"],
    required: true,
  },
  {
    type: "radio",
    key: "aandoeningZiekte",
    label: "Heeft het dier een aandoening/ziekte?",
    options: [
      "Geen aandoening/ziekte: kerngezond en vastgesteld door de dierenarts",
      "Geen aandoening/ziekte: gezond maar niet vastgesteld door een dierenarts",
      "Heeft wel een aandoening/ziekte niet vastgesteld door een dierenarts (beschrijf hierna zo goed mogelijk de aandoening)",
      "Heeft wel een aandoening/ziekte wel vastgesteld door een dierenarts (beschrijf hierna zo goed mogelijk de aandoening)",
    ],
    required: true,
  },
  {
    type: "text",
    key: "beschrijvingAandoening",
    label: "Indien een aandoening: Beschrijf zo goed mogelijk de aandoening:",
  },
  {
    type: "text",
    key: "zindelijk",
    label: "Is het dier zindelijk?",
    required: true,
  },
  {
    type: "radio",
    key: "andereDieren",
    label: "Kan het dier met andere dieren overweg?",
    options: [
      "Kan niet om met andere dieren",
      "Kan met hond(en)",
      "Kan met Kat(ten)",
    ],
    allowOther: true,
    required: true,
  },
  {
    type: "checkbox",
    key: "agressiefGedrag",
    label: "Vertoont het dier angstig of agressief gedrag?",
    options: [
      "Is niet angstig of agressief",
      "Angstig",
      "Agressief gedrag tov kinderen",
      "Agressief gedrag tov volwassenen",
    ],
    required: true,
  },
  {
    type: "radio",
    key: "vlooienTeken",
    label: "Werd het dier onlangs behandeld tegen vlooien/teken?",
    options: ["Ja", "Nee"],
    required: true,
  },
  {
    type: "radio",
    key: "wormen",
    label: "Werd het dier onlangs behandeld tegen wormen?",
    options: ["Ja", "Nee"],
    required: true,
  },
];

const BESCHRIJVING_QUESTIONS: Question[] = [
  { type: "text", key: "karakter", label: "Beschrijf het karakter" },
];

const WANNEER_QUESTIONS: Question[] = [
  {
    type: "checkbox",
    key: "beschikbareDagen",
    label:
      "Op welke dagen kan je, na afspraak, langskomen? Dit kan op maandag, dinsdag, woensdag, vrijdag en zaterdag",
    options: [
      "Maandag (10 tot 14u)",
      "Dinsdag (10 tot 14u)",
      "Woensdag (10 tot 14u)",
      "vrijdag (10 tot 14u)",
      "Zaterdag (10 tot 15u30)",
    ],
    required: true,
  },
];

const SECTIONS: Section[] = [
  { title: "Info over het dier", questions: INFO_DIER_QUESTIONS },
  { title: "Beschrijving van het dier", questions: BESCHRIJVING_QUESTIONS },
  { title: "Wanneer kan u langs komen?", questions: WANNEER_QUESTIONS },
];

// --- Styling ---
const inputBase =
  "mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors";
const inputNormal = `${inputBase} border-gray-300 focus:border-[#52796f] focus:ring-1 focus:ring-[#52796f]`;
const inputError = `${inputBase} border-red-500 bg-red-50/40 focus:border-red-500 focus:ring-1 focus:ring-red-500`;
const labelNormal = "block text-sm font-medium text-gray-700";
const labelError = "block text-sm font-medium text-red-700";
const errorMsg = "mt-1.5 text-xs font-medium text-red-600";

function scrollToFirstError() {
  setTimeout(() => {
    const el = document.querySelector("[data-field-error]");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 50);
}

export default function SurrenderForm() {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [otherValues, setOtherValues] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; name: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Base fields
  const [email, setEmail] = useState("");
  const [species, setSpecies] = useState("");
  const [customSpecies, setCustomSpecies] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [surrenderReason, setSurrenderReason] = useState("");

  const allQuestions = SECTIONS.flatMap((s) => s.questions);

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const submitAction = async (
    _prev: SurrenderResult | null,
    _formData: FormData,
  ): Promise<SurrenderResult> => {
    const newErrors: Record<string, string> = {};

    // Validate base fields
    if (!email.trim()) newErrors.email = "E-mailadres is verplicht";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Ongeldig e-mailadres";
    if (!species) newErrors.species = "Selecteer een diersoort";
    if (species === "__other__" && !customSpecies.trim()) newErrors.species = "Vul de diersoort in";
    if (!ownerName.trim()) newErrors.ownerName = "Naam is verplicht";
    if (!address.trim()) newErrors.address = "Straat en huisnummer is verplicht";
    if (!postalCode.trim()) newErrors.postalCode = "Postcode en gemeente is verplicht";
    if (!phone.trim()) newErrors.phone = "Gsm nummer is verplicht";
    if (!surrenderReason.trim()) newErrors.surrenderReason = "Reden van afstand is verplicht";

    // Validate questionnaire fields
    for (const q of allQuestions) {
      if (!q.required) continue;
      const val = answers[q.key];
      if (!val || (typeof val === "string" && !val.trim()) || (Array.isArray(val) && val.length === 0)) {
        newErrors[q.key] = q.type === "text"
          ? "Dit veld is verplicht"
          : q.type === "radio"
            ? "Selecteer een optie"
            : "Selecteer minstens 1 optie";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      scrollToFirstError();
      const count = Object.keys(newErrors).length;
      return {
        success: false,
        error: `Er ${count === 1 ? "is 1 veld" : `zijn ${count} velden`} niet correct ingevuld. Corrigeer de gemarkeerde velden.`,
      };
    }
    setErrors({});

    const resolvedAnswers = { ...answers } as Record<string, unknown>;
    for (const [key, val] of Object.entries(resolvedAnswers)) {
      if (val === "__other__" && otherValues[key]) {
        resolvedAnswers[key] = otherValues[key];
      }
    }

    const speciesValue = species === "__other__" ? customSpecies : species;

    const payload = {
      email,
      species: speciesValue,
      ownerName,
      address,
      postalCode,
      phone,
      surrenderReason,
      answers: resolvedAnswers,
      photoUrls: uploadedFiles.map((f) => f.url),
    };

    const fd = new FormData();
    fd.append("json", JSON.stringify(payload));
    return submitSurrenderRequest(null, fd);
  };

  const [state, formAction, isPending] = useActionState(submitAction, null);

  if (state?.success) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="font-heading text-2xl font-bold text-emerald-800">
          Aanvraag ontvangen!
        </h2>
        <div className="mt-4 space-y-3 text-sm text-emerald-700">
          <p>
            Bedankt voor het indienen van je aanvraag. We nemen zo snel mogelijk
            contact met je op om een afspraak in te plannen.
          </p>
          <p>
            Jammer genoeg werken we vaak met een wachtlijst, zeker voor grotere
            dieren. Bedankt voor je geduld.
          </p>
        </div>
        <a
          href="/"
          className="mt-6 inline-block rounded-lg bg-[#1b4332] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#2d6a4f]"
        >
          Terug naar startpagina
        </a>
      </div>
    );
  }

  const globalError = state && !state.success ? state.error : undefined;

  const updateAnswer = (key: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const toggleCheckbox = (key: string, option: string) => {
    setAnswers((prev) => {
      const current = (prev[key] as string[]) || [];
      return {
        ...prev,
        [key]: current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option],
      };
    });
    clearError(key);
  };

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-6" noValidate>
      {/* Header */}
      <div className="rounded-2xl border-t-4 border-[#52796f] bg-white p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
          Afstand (1 dier per formulier!)
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Dierenasiel Ninove &mdash; Vul dit formulier in om een dier af te
          staan. Alle velden met <span className="text-red-500">*</span> zijn verplicht.
        </p>
      </div>

      {globalError && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4" role="alert">
          <div className="flex gap-2">
            <svg className="h-5 w-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-red-800">{globalError}</p>
          </div>
        </div>
      )}

      {/* E-mail + diersoort */}
      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <BaseField label="E-mailadres" error={errors.email} required>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
            className={errors.email ? inputError : inputNormal}
            aria-invalid={!!errors.email}
          />
        </BaseField>

        <fieldset {...(errors.species ? { "data-field-error": true } : {})} aria-invalid={!!errors.species}>
          <legend className={errors.species ? labelError : labelNormal}>
            Welk dier wenst u af te staan? <span className="text-red-500">*</span>
          </legend>
          <div className={`mt-2 space-y-2 rounded-lg px-3 py-2 ${errors.species ? "border border-red-300 bg-red-50/40" : ""}`}>
            {["Hond", "Kat"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="species"
                  value={opt.toLowerCase()}
                  checked={species === opt.toLowerCase()}
                  onChange={() => { setSpecies(opt.toLowerCase()); clearError("species"); }}
                  className="h-4 w-4 border-gray-300 text-[#52796f] focus:ring-[#52796f]"
                />
                {opt}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="species"
                value="__other__"
                checked={species === "__other__"}
                onChange={() => { setSpecies("__other__"); clearError("species"); }}
                className="h-4 w-4 border-gray-300 text-[#52796f] focus:ring-[#52796f]"
              />
              Anders:
              <input
                type="text"
                value={customSpecies}
                onChange={(e) => {
                  setCustomSpecies(e.target.value);
                  setSpecies("__other__");
                  clearError("species");
                }}
                className={`ml-1 flex-1 rounded border px-2 py-1 text-sm outline-none ${
                  errors.species
                    ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-300 focus:border-[#52796f] focus:ring-1 focus:ring-[#52796f]"
                }`}
              />
            </label>
          </div>
          {errors.species && <p className={errorMsg} role="alert">{errors.species}</p>}
        </fieldset>
      </div>

      {/* Info huidige eigenaar */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-[#1b4332]">
          Info huidige eigenaar van het dier
        </h2>
        <div className="space-y-4">
          <BaseField label="Naam en voornaam eigenaar van het dier" error={errors.ownerName} required>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => { setOwnerName(e.target.value); clearError("ownerName"); }}
              className={errors.ownerName ? inputError : inputNormal}
              aria-invalid={!!errors.ownerName}
            />
          </BaseField>
          <BaseField label="Straat en huisnummer" error={errors.address} required>
            <input
              type="text"
              value={address}
              onChange={(e) => { setAddress(e.target.value); clearError("address"); }}
              className={errors.address ? inputError : inputNormal}
              aria-invalid={!!errors.address}
            />
          </BaseField>
          <BaseField label="Postcode en gemeente" error={errors.postalCode} required>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => { setPostalCode(e.target.value); clearError("postalCode"); }}
              className={errors.postalCode ? inputError : inputNormal}
              aria-invalid={!!errors.postalCode}
            />
          </BaseField>
          <BaseField label="Gsm nummer" error={errors.phone} required>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); clearError("phone"); }}
              className={errors.phone ? inputError : inputNormal}
              aria-invalid={!!errors.phone}
            />
          </BaseField>
          <BaseField label="Reden van afstand" error={errors.surrenderReason} required>
            <textarea
              rows={3}
              value={surrenderReason}
              onChange={(e) => { setSurrenderReason(e.target.value); clearError("surrenderReason"); }}
              className={`${errors.surrenderReason ? inputError : inputNormal} resize-y`}
              aria-invalid={!!errors.surrenderReason}
            />
          </BaseField>
        </div>
      </div>

      {/* Sections with questions */}
      {SECTIONS.map((section, si) => (
        <div key={si} className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#1b4332]">
            {section.title}
          </h2>

          {/* Photo upload in "Info over het dier" section */}
          {si === 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Upload foto&apos;s van het dier{" "}
                <span className="text-red-500">*</span>
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Upload maximaal 5 bestanden (afbeelding). Maximaal 10 MB per
                bestand.
              </p>
              <AdoptionPhotoUpload files={uploadedFiles} onChange={setUploadedFiles} />
            </div>
          )}

          <div className="space-y-6">
            {section.questions.map((q) => (
              <QuestionField
                key={q.key}
                question={q}
                value={answers[q.key]}
                otherValue={otherValues[q.key] || ""}
                onChange={updateAnswer}
                onToggleCheckbox={toggleCheckbox}
                onOtherChange={(key, val) =>
                  setOtherValues((prev) => ({ ...prev, [key]: val }))
                }
                error={errors[q.key]}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#1b4332] px-8 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Verzenden..." : "Aanvraag indienen"}
        </button>
      </div>

      <p className="pb-8 text-xs text-gray-400">
        Door dit formulier in te dienen ga je akkoord dat je gegevens verwerkt
        worden door Dierenasiel Ninove in het kader van de afstandsprocedure.
      </p>
    </form>
  );
}

// --- Reusable base field wrapper ---
function BaseField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div {...(error ? { "data-field-error": true } : {})}>
      <label className={error ? labelError : labelNormal}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && <p className={errorMsg} role="alert">{error}</p>}
    </div>
  );
}

// --- Reusable question field renderer ---
function QuestionField({
  question,
  value,
  otherValue,
  onChange,
  onToggleCheckbox,
  onOtherChange,
  error,
}: {
  question: Question;
  value: string | string[] | undefined;
  otherValue: string;
  onChange: (key: string, value: string | string[]) => void;
  onToggleCheckbox: (key: string, option: string) => void;
  onOtherChange: (key: string, value: string) => void;
  error?: string;
}) {
  const lbl = error ? labelError : labelNormal;

  if (question.type === "text") {
    return (
      <div {...(error ? { "data-field-error": true } : {})}>
        <label className={lbl}>
          {question.label}
          {question.required && <span className="text-red-500"> *</span>}
        </label>
        <input
          type="text"
          value={(value as string) || ""}
          onChange={(e) => onChange(question.key, e.target.value)}
          className={error ? inputError : inputNormal}
          aria-invalid={!!error}
          aria-describedby={error ? `err-${question.key}` : undefined}
        />
        {error && <p id={`err-${question.key}`} className={errorMsg} role="alert">{error}</p>}
      </div>
    );
  }

  if (question.type === "radio") {
    return (
      <fieldset {...(error ? { "data-field-error": true } : {})} aria-invalid={!!error}>
        <legend className={lbl}>
          {question.label}
          {question.required && <span className="text-red-500"> *</span>}
        </legend>
        <div className={`mt-2 space-y-2 rounded-lg px-3 py-2 ${error ? "border border-red-300 bg-red-50/40" : ""}`}>
          {question.options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name={question.key}
                value={option}
                checked={value === option}
                onChange={() => onChange(question.key, option)}
                className="h-4 w-4 border-gray-300 text-[#52796f] focus:ring-[#52796f]"
              />
              {option}
            </label>
          ))}
          {question.allowOther && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name={question.key}
                value="__other__"
                checked={value === "__other__"}
                onChange={() => onChange(question.key, "__other__")}
                className="h-4 w-4 border-gray-300 text-[#52796f] focus:ring-[#52796f]"
              />
              Anders:
              <input
                type="text"
                value={otherValue}
                onChange={(e) => {
                  onOtherChange(question.key, e.target.value);
                  onChange(question.key, "__other__");
                }}
                className={`ml-1 flex-1 rounded border px-2 py-1 text-sm outline-none ${
                  error
                    ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-300 focus:border-[#52796f] focus:ring-1 focus:ring-[#52796f]"
                }`}
              />
            </label>
          )}
        </div>
        {error && <p id={`err-${question.key}`} className={errorMsg} role="alert">{error}</p>}
      </fieldset>
    );
  }

  if (question.type === "checkbox") {
    const selected = (value as string[]) || [];
    return (
      <fieldset {...(error ? { "data-field-error": true } : {})} aria-invalid={!!error}>
        <legend className={lbl}>
          {question.label}
          {question.required && <span className="text-red-500"> *</span>}
        </legend>
        <div className={`mt-2 space-y-2 rounded-lg px-3 py-2 ${error ? "border border-red-300 bg-red-50/40" : ""}`}>
          {question.options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => onToggleCheckbox(question.key, option)}
                className="h-4 w-4 rounded border-gray-300 text-[#52796f] focus:ring-[#52796f]"
              />
              {option}
            </label>
          ))}
        </div>
        {error && <p id={`err-${question.key}`} className={errorMsg} role="alert">{error}</p>}
      </fieldset>
    );
  }

  return null;
}
