"use client";

import { useActionState, useState } from "react";
import { submitPublicAdoptionRequest } from "@/lib/actions/public-adoption";
import type { PublicAdoptionResult } from "@/lib/actions/public-adoption";

type Species = "hond" | "kat";

interface Props {
  species: Species;
}

// --- Question configs per species ---

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
  placeholder?: string;
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

const CAT_QUESTIONS: Question[] = [
  {
    type: "text",
    key: "andereHuisdieren",
    label: "Zijn er al andere katten aanwezig? Honden of andere huisdieren?",
    required: true,
  },
  {
    type: "radio",
    key: "binnenBuiten",
    label: "Wil je een binnenkat of een kat die binnen en buiten kan lopen?",
    options: ["Binnenkat", "Binnen en buiten"],
    required: true,
  },
  {
    type: "radio",
    key: "voorkeurLeeftijd",
    label: "Gaat je voorkeur uit naar een volwassen kat of liever een kitten?",
    options: ["Volwassen kat", "Kitten"],
    required: true,
  },
  {
    type: "radio",
    key: "woningType",
    label: "Welke woning heb je?",
    options: ["Huis", "Appartement"],
    allowOther: true,
    required: true,
  },
  {
    type: "radio",
    key: "eigenaarHuurder",
    label: "Eigenaar of huurder?",
    options: ["Eigenaar", "Huurder"],
    required: true,
  },
  {
    type: "radio",
    key: "huurderDierenToegestaan",
    label: "Als je huurder bent, mag je van de verhuurder dieren houden?",
    options: ["JA", "NEEN"],
  },
  {
    type: "text",
    key: "kinderen",
    label: "Zijn er kinderen aanwezig in het gezin? Indien wel geef hun leeftijd(en)",
    required: true,
  },
  {
    type: "checkbox",
    key: "beschikbareDagen",
    label: "Op welke dagen kan je langskomen? Dit kan op maandag, woensdag, donderdag, vrijdag en zaterdag",
    options: [
      "Maandag (10u30 tot 15u30)",
      "Woensdag (10u30 tot 15u30)",
      "Donderdag (13 tot 16u)",
      "Vrijdag (10u30 tot 15u30)",
      "Zaterdag (10u30 tot 15u30)",
    ],
    required: true,
  },
  {
    type: "text",
    key: "adoptieVoorzien",
    label: "Voor wanneer is de adoptie voorzien?",
    required: true,
  },
];

const DOG_QUESTIONS: Question[] = [
  {
    type: "text",
    key: "andereHuisdieren",
    label: "Heb je al honden of andere huisdieren? Zo ja, welke?",
    required: true,
  },
  {
    type: "radio",
    key: "woningType",
    label: "Welke woning heb je?",
    options: ["Huis met tuin", "Huis zonder tuin", "Appartement"],
    allowOther: true,
    required: true,
  },
  {
    type: "radio",
    key: "tuinOmheind",
    label: "Is je tuin volledig omheind?",
    options: ["JA", "NEEN", "Niet van toepassing"],
  },
  {
    type: "radio",
    key: "eigenaarHuurder",
    label: "Eigenaar of huurder?",
    options: ["Eigenaar", "Huurder"],
    required: true,
  },
  {
    type: "radio",
    key: "huurderDierenToegestaan",
    label: "Als je huurder bent, mag je van de verhuurder dieren houden?",
    options: ["JA", "NEEN"],
  },
  {
    type: "text",
    key: "kinderen",
    label: "Zijn er kinderen aanwezig in het gezin? Indien wel geef hun leeftijd(en)",
    required: true,
  },
  {
    type: "text",
    key: "wieLatUit",
    label: "Wie gaat de hond uitlaten?",
    required: true,
  },
  {
    type: "text",
    key: "urenAlleen",
    label: "Hoeveel uur per dag zou de hond alleen zijn?",
    required: true,
  },
  {
    type: "text",
    key: "ervaringHonden",
    label: "Heb je ervaring met honden? Zo ja, beschrijf kort.",
    required: true,
  },
  {
    type: "checkbox",
    key: "beschikbareDagen",
    label: "Op welke dagen kan je langskomen? Dit kan op maandag, woensdag, donderdag, vrijdag en zaterdag",
    options: [
      "Maandag (10u30 tot 15u30)",
      "Woensdag (10u30 tot 15u30)",
      "Donderdag (13 tot 16u)",
      "Vrijdag (10u30 tot 15u30)",
      "Zaterdag (10u30 tot 15u30)",
    ],
    required: true,
  },
  {
    type: "text",
    key: "adoptieVoorzien",
    label: "Voor wanneer is de adoptie voorzien?",
    required: true,
  },
];

const QUESTIONS: Record<Species, Question[]> = {
  kat: CAT_QUESTIONS,
  hond: DOG_QUESTIONS,
};

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#52796f] focus:ring-1 focus:ring-[#52796f] outline-none";
const labelClass = "block text-sm font-medium text-gray-700";

export default function PublicAdoptionForm({ species }: Props) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [otherValues, setOtherValues] = useState<Record<string, string>>({});

  const questions = QUESTIONS[species];

  const submitAction = async (
    _prev: PublicAdoptionResult | null,
    formData: FormData,
  ): Promise<PublicAdoptionResult> => {
    const payload = {
      species,
      requestedAnimalName: formData.get("requestedAnimalName") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
      address: formData.get("address") as string,
      postalCode: formData.get("postalCode") as string,
      phone: formData.get("phone") as string,
      email: (formData.get("email") as string) || "",
      questionnaireAnswers: { ...answers },
    };

    // Replace "Anders" radio values with typed other text
    for (const [key, val] of Object.entries(payload.questionnaireAnswers)) {
      if (val === "__other__" && otherValues[key]) {
        payload.questionnaireAnswers[key] = otherValues[key];
      }
    }

    const fd = new FormData();
    fd.append("json", JSON.stringify(payload));
    return submitPublicAdoptionRequest(null, fd);
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
          Bedankt voor je aanvraag!
        </h2>
        <p className="mt-3 text-sm text-emerald-700">
          We hebben je adoptie-aanvraag goed ontvangen. Een medewerker van het dierenasiel
          zal je aanvraag bekijken en zo snel mogelijk contact met je opnemen.
        </p>
        <a
          href="/adoptie-aanvraag"
          className="mt-6 inline-block rounded-lg bg-[#1b4332] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#2d6a4f]"
        >
          Terug naar overzicht
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

  const speciesLabel = species === "hond" ? "hond" : "kat/kitten";
  const title = species === "hond"
    ? "Adoptieaanvraag hond"
    : "Adoptieaanvraag kat/kitten";

  return (
    <form action={formAction} className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="rounded-2xl border-t-4 border-[#52796f] bg-white p-6 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-[#1b4332]">{title}</h1>
        <p className="mt-2 text-sm text-gray-600">
          Dierenasiel Ninove &mdash; Vul dit formulier in om een adoptie-aanvraag in te dienen.
          Alle velden met <span className="text-red-500">*</span> zijn verplicht.
        </p>
      </div>

      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{globalError}</p>
        </div>
      )}

      {/* Gewenst dier */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <label htmlFor="requestedAnimalName" className={labelClass}>
          Welke {speciesLabel} wens je te adopteren? <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="requestedAnimalName"
          name="requestedAnimalName"
          required
          className={inputClass}
        />
      </div>

      {/* Persoonlijke gegevens */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-[#1b4332]">Gegevens adoptant</h2>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className={labelClass}>
                Voornaam <span className="text-red-500">*</span>
              </label>
              <input type="text" id="firstName" name="firstName" required className={inputClass} />
            </div>
            <div>
              <label htmlFor="lastName" className={labelClass}>
                Achternaam <span className="text-red-500">*</span>
              </label>
              <input type="text" id="lastName" name="lastName" required className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="dateOfBirth" className={labelClass}>
              Geboortedatum <span className="text-red-500">*</span>
            </label>
            <input type="date" id="dateOfBirth" name="dateOfBirth" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="address" className={labelClass}>
              Straat en huisnummer <span className="text-red-500">*</span>
            </label>
            <input type="text" id="address" name="address" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="postalCode" className={labelClass}>
              Postcode en gemeente <span className="text-red-500">*</span>
            </label>
            <input type="text" id="postalCode" name="postalCode" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Gsm nummer <span className="text-red-500">*</span>
            </label>
            <input type="tel" id="phone" name="phone" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              E-mailadres
            </label>
            <input type="email" id="email" name="email" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Vragenlijst */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-[#1b4332]">Vragenlijst</h2>
        <div className="space-y-6">
          {questions.map((q) => (
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
            />
          ))}
        </div>
      </div>

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
        Door dit formulier in te dienen ga je akkoord dat je gegevens verwerkt worden door
        Dierenasiel Ninove in het kader van de adoptie-procedure.
      </p>
    </form>
  );
}

function QuestionField({
  question,
  value,
  otherValue,
  onChange,
  onToggleCheckbox,
  onOtherChange,
}: {
  question: Question;
  value: string | string[] | undefined;
  otherValue: string;
  onChange: (key: string, value: string | string[]) => void;
  onToggleCheckbox: (key: string, option: string) => void;
  onOtherChange: (key: string, value: string) => void;
}) {
  if (question.type === "text") {
    return (
      <div>
        <label className={labelClass}>
          {question.label}
          {question.required && <span className="text-red-500"> *</span>}
        </label>
        <input
          type="text"
          value={(value as string) || ""}
          onChange={(e) => onChange(question.key, e.target.value)}
          placeholder={question.placeholder}
          className={inputClass}
        />
      </div>
    );
  }

  if (question.type === "radio") {
    return (
      <div>
        <p className={labelClass}>
          {question.label}
          {question.required && <span className="text-red-500"> *</span>}
        </p>
        <div className="mt-2 space-y-2">
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
                className="ml-1 flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-[#52796f] focus:ring-1 focus:ring-[#52796f] outline-none"
              />
            </label>
          )}
        </div>
      </div>
    );
  }

  if (question.type === "checkbox") {
    const selected = (value as string[]) || [];
    return (
      <div>
        <p className={labelClass}>
          {question.label}
          {question.required && <span className="text-red-500"> *</span>}
        </p>
        <div className="mt-2 space-y-2">
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
      </div>
    );
  }

  return null;
}
