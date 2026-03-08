"use client";

import { useActionState, useState } from "react";
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

// --- Sections ---
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
  {
    type: "text",
    key: "karakter",
    label: "Beschrijf het karakter",
  },
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

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#52796f] focus:ring-1 focus:ring-[#52796f] outline-none";
const labelClass = "block text-sm font-medium text-gray-700";

export default function SurrenderForm() {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [otherValues, setOtherValues] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<
    { url: string; name: string }[]
  >([]);
  const [missingFields, setMissingFields] = useState<Set<string>>(new Set());

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

  const submitAction = async (
    _prev: SurrenderResult | null,
    _formData: FormData,
  ): Promise<SurrenderResult> => {
    // Validate base fields
    const baseErrors: string[] = [];
    if (!email) baseErrors.push("email");
    if (!species) baseErrors.push("species");
    if (!ownerName) baseErrors.push("ownerName");
    if (!address) baseErrors.push("address");
    if (!postalCode) baseErrors.push("postalCode");
    if (!phone) baseErrors.push("phone");
    if (!surrenderReason) baseErrors.push("surrenderReason");

    // Validate questionnaire
    const missing = new Set<string>();
    for (const q of allQuestions) {
      if (!q.required) continue;
      const val = answers[q.key];
      if (
        !val ||
        (typeof val === "string" && !val.trim()) ||
        (Array.isArray(val) && val.length === 0)
      ) {
        missing.add(q.key);
      }
    }

    if (baseErrors.length > 0 || missing.size > 0) {
      setMissingFields(new Set([...baseErrors, ...missing]));
      return {
        success: false,
        error:
          "Niet alle verplichte velden zijn ingevuld. Controleer het formulier.",
      };
    }
    setMissingFields(new Set());

    const resolvedAnswers = { ...answers } as Record<string, unknown>;
    for (const [key, val] of Object.entries(resolvedAnswers)) {
      if (val === "__other__" && otherValues[key]) {
        resolvedAnswers[key] = otherValues[key];
      }
    }

    const speciesValue =
      species === "__other__" ? customSpecies : species;

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
          <svg
            className="h-8 w-8 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
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
  };

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="rounded-2xl border-t-4 border-[#52796f] bg-white p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
          Afstand (1 dier per formulier!)
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Dierenasiel Ninove &mdash; Vul dit formulier in om een dier af te
          staan. Alle velden met{" "}
          <span className="text-red-500">*</span> zijn verplicht.
        </p>
      </div>

      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{globalError}</p>
        </div>
      )}

      {/* E-mail + diersoort */}
      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        <div>
          <label htmlFor="email" className={labelClass}>
            E-mailadres <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`${inputClass} ${missingFields.has("email") ? "border-red-300 bg-red-50/30" : ""}`}
          />
          {missingFields.has("email") && (
            <p className="mt-1 text-xs text-red-600">Dit veld is verplicht</p>
          )}
        </div>

        <div>
          <p className={labelClass}>
            Welk dier wenst u af te staan?{" "}
            <span className="text-red-500">*</span>
          </p>
          <div
            className={`mt-2 space-y-2 ${missingFields.has("species") ? "rounded-lg border border-red-300 bg-red-50/30 p-3 -m-1" : ""}`}
          >
            {["Hond", "Kat"].map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="radio"
                  name="species"
                  value={opt.toLowerCase()}
                  checked={species === opt.toLowerCase()}
                  onChange={() => setSpecies(opt.toLowerCase())}
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
                onChange={() => setSpecies("__other__")}
                className="h-4 w-4 border-gray-300 text-[#52796f] focus:ring-[#52796f]"
              />
              Anders:
              <input
                type="text"
                value={customSpecies}
                onChange={(e) => {
                  setCustomSpecies(e.target.value);
                  setSpecies("__other__");
                }}
                className="ml-1 flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-[#52796f] focus:ring-1 focus:ring-[#52796f] outline-none"
              />
            </label>
          </div>
          {missingFields.has("species") && (
            <p className="mt-1 text-xs text-red-600">Selecteer een optie</p>
          )}
        </div>
      </div>

      {/* Info huidige eigenaar */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-[#1b4332]">
          Info huidige eigenaar van het dier
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="ownerName" className={labelClass}>
              Naam en voornaam eigenaar van het dier{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="ownerName"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
              className={`${inputClass} ${missingFields.has("ownerName") ? "border-red-300 bg-red-50/30" : ""}`}
            />
            {missingFields.has("ownerName") && (
              <p className="mt-1 text-xs text-red-600">
                Dit veld is verplicht
              </p>
            )}
          </div>
          <div>
            <label htmlFor="address" className={labelClass}>
              Straat en huisnummer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className={`${inputClass} ${missingFields.has("address") ? "border-red-300 bg-red-50/30" : ""}`}
            />
            {missingFields.has("address") && (
              <p className="mt-1 text-xs text-red-600">
                Dit veld is verplicht
              </p>
            )}
          </div>
          <div>
            <label htmlFor="postalCode" className={labelClass}>
              Postcode en gemeente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="postalCode"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
              className={`${inputClass} ${missingFields.has("postalCode") ? "border-red-300 bg-red-50/30" : ""}`}
            />
            {missingFields.has("postalCode") && (
              <p className="mt-1 text-xs text-red-600">
                Dit veld is verplicht
              </p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Gsm nummer <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className={`${inputClass} ${missingFields.has("phone") ? "border-red-300 bg-red-50/30" : ""}`}
            />
            {missingFields.has("phone") && (
              <p className="mt-1 text-xs text-red-600">
                Dit veld is verplicht
              </p>
            )}
          </div>
          <div>
            <label htmlFor="surrenderReason" className={labelClass}>
              Reden van afstand <span className="text-red-500">*</span>
            </label>
            <textarea
              id="surrenderReason"
              rows={3}
              value={surrenderReason}
              onChange={(e) => setSurrenderReason(e.target.value)}
              required
              className={`${inputClass} resize-y ${missingFields.has("surrenderReason") ? "border-red-300 bg-red-50/30" : ""}`}
            />
            {missingFields.has("surrenderReason") && (
              <p className="mt-1 text-xs text-red-600">
                Dit veld is verplicht
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sections with questions */}
      {SECTIONS.map((section, si) => (
        <div key={si} className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-[#1b4332]">
            {section.title}
          </h2>

          {/* Photo upload in "Info over het dier" section, after naamDier */}
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
              <AdoptionPhotoUpload
                files={uploadedFiles}
                onChange={setUploadedFiles}
              />
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
                hasError={missingFields.has(q.key)}
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
        worden door Dierenasiel Ninove in het kader van de
        afstandsprocedure.
      </p>
    </form>
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
  hasError,
}: {
  question: Question;
  value: string | string[] | undefined;
  otherValue: string;
  onChange: (key: string, value: string | string[]) => void;
  onToggleCheckbox: (key: string, option: string) => void;
  onOtherChange: (key: string, value: string) => void;
  hasError?: boolean;
}) {
  const errorBorder = hasError
    ? "rounded-lg border border-red-300 bg-red-50/30 p-3 -m-3"
    : "";

  if (question.type === "text") {
    return (
      <div className={errorBorder}>
        <label className={labelClass}>
          {question.label}
          {question.required && <span className="text-red-500"> *</span>}
        </label>
        <input
          type="text"
          value={(value as string) || ""}
          onChange={(e) => onChange(question.key, e.target.value)}
          className={inputClass}
        />
        {hasError && (
          <p className="mt-1 text-xs text-red-600">Dit veld is verplicht</p>
        )}
      </div>
    );
  }

  if (question.type === "radio") {
    return (
      <div className={errorBorder}>
        <p className={labelClass}>
          {question.label}
          {question.required && <span className="text-red-500"> *</span>}
        </p>
        <div className="mt-2 space-y-2">
          {question.options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
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
                className="ml-1 flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-[#52796f] focus:ring-1 focus:ring-[#52796f] outline-none"
              />
            </label>
          )}
        </div>
        {hasError && (
          <p className="mt-1 text-xs text-red-600">Selecteer een optie</p>
        )}
      </div>
    );
  }

  if (question.type === "checkbox") {
    const selected = (value as string[]) || [];
    return (
      <div className={errorBorder}>
        <p className={labelClass}>
          {question.label}
          {question.required && <span className="text-red-500"> *</span>}
        </p>
        <div className="mt-2 space-y-2">
          {question.options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
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
        {hasError && (
          <p className="mt-1 text-xs text-red-600">
            Selecteer minstens 1 optie
          </p>
        )}
      </div>
    );
  }

  return null;
}
