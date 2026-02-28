"use client";

import { useState, useTransition } from "react";
import { updateWalkingClubThreshold } from "@/lib/actions/shelter-settings";

interface Props {
  threshold: number;
}

export default function ThresholdSettingPanel({ threshold }: Props) {
  const [value, setValue] = useState(threshold);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsError(false);
    startTransition(async () => {
      const result = await updateWalkingClubThreshold(value);
      if (result.success) {
        setMessage("Drempel bijgewerkt.");
      } else {
        setIsError(true);
        setMessage(result.error ?? "Er ging iets mis.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-[#1b4332]">
        Wandelclub
      </h3>
      <p className="mb-4 text-sm text-gray-500">
        Minimum aantal wandelingen om lid te worden van de wandelclub.
      </p>

      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div>
          <label htmlFor="threshold" className="block text-sm font-medium text-gray-700">
            Drempel (wandelingen)
          </label>
          <input
            type="number"
            id="threshold"
            min={1}
            value={value}
            onChange={(e) => setValue(parseInt(e.target.value, 10) || 1)}
            disabled={isPending}
            className="mt-1 w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#2d6a4f] focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || value === threshold}
          className="rounded-md bg-[#2d6a4f] px-4 py-2 text-sm font-medium text-white hover:bg-[#1b4332] disabled:opacity-50"
        >
          {isPending ? "Opslaan..." : "Opslaan"}
        </button>
      </form>

      {message && (
        <p className={`mt-2 text-sm ${isError ? "text-red-600" : "text-green-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
