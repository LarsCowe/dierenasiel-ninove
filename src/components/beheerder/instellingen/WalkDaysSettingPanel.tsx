"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateWalkDays } from "@/lib/actions/shelter-settings";

interface Props {
  walkDays: number[];
}

const DAY_LABELS: { num: number; label: string }[] = [
  { num: 1, label: "Maandag" },
  { num: 2, label: "Dinsdag" },
  { num: 3, label: "Woensdag" },
  { num: 4, label: "Donderdag" },
  { num: 5, label: "Vrijdag" },
  { num: 6, label: "Zaterdag" },
  { num: 0, label: "Zondag" },
];

export default function WalkDaysSettingPanel({ walkDays }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set(walkDays));
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();

  const toggle = (num: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
    setFeedback(null);
  };

  const save = () => {
    const days = Array.from(selected).sort((a, b) => a - b);
    startTransition(async () => {
      const result = await updateWalkDays(days);
      if (result.success) {
        setFeedback("✓ Wandeldagen opgeslagen.");
        router.refresh();
      } else {
        setFeedback(result.error || "Opslaan mislukt.");
      }
    });
  };

  const initial = new Set(walkDays);
  const dirty =
    selected.size !== initial.size ||
    Array.from(selected).some((n) => !initial.has(n));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-bold text-[#1b4332]">Wandeldagen</h2>
      <p className="mt-1 text-sm text-gray-500">
        Kies op welke weekdagen wandelaars een wandeling kunnen boeken.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {DAY_LABELS.map(({ num, label }) => {
          const isOn = selected.has(num);
          return (
            <label
              key={num}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                isOn
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={isOn}
                onChange={() => toggle(num)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || isPending}
          className="rounded-md bg-[#1b4332] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending ? "Opslaan..." : "Opslaan"}
        </button>
        {feedback && <p className="text-sm text-gray-600">{feedback}</p>}
      </div>
    </div>
  );
}
