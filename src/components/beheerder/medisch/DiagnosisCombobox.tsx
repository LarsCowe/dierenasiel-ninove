"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDiagnosisAction } from "@/lib/actions/veterinary-diagnoses";

interface Props {
  value: string;
  onChange: (value: string) => void;
  diagnoses: { id: number; name: string }[];
}

/**
 * Combobox met `<datalist>` voor bestaande diagnoses + expliciete
 * "toevoegen"-knop voor onbekende waarden (Story 10.10). Vrije invoer
 * blijft mogelijk — de knop verschijnt pas wanneer de waarde niet al
 * in de lijst voorkomt.
 */
export default function DiagnosisCombobox({ value, onChange, diagnoses }: Props) {
  const listId = useId();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();

  const trimmed = value.trim();
  const existsInList = diagnoses.some(
    (d) => d.name.toLowerCase() === trimmed.toLowerCase(),
  );
  const canAdd = trimmed.length >= 2 && !existsInList && !isPending;

  const handleAdd = () => {
    startTransition(async () => {
      const result = await addDiagnosisAction({ name: trimmed });
      if (result.success) {
        setFeedback(`✓ '${trimmed}' toegevoegd aan de lijst`);
        router.refresh();
      } else {
        setFeedback(result.error || "Toevoegen mislukt");
      }
    });
  };

  return (
    <div>
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setFeedback(null);
        }}
        placeholder="Begin te typen..."
        className="mt-0.5 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
      />
      <datalist id={listId}>
        {diagnoses.map((d) => (
          <option key={d.id} value={d.name} />
        ))}
      </datalist>
      {canAdd && (
        <button
          type="button"
          onClick={handleAdd}
          className="mt-1 text-xs text-emerald-700 hover:underline"
        >
          + &lsquo;{trimmed}&rsquo; toevoegen aan diagnoselijst
        </button>
      )}
      {feedback && (
        <p className="mt-1 text-xs text-gray-600">{feedback}</p>
      )}
    </div>
  );
}
