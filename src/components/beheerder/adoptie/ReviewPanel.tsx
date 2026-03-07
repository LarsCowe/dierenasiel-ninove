"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitReview } from "@/lib/actions/adoption-reviews";
import { computeReviewResult } from "@/lib/utils/review-result";

interface Props {
  candidateId: number;
  reviewMartine: string | null;
  reviewNathalie: string | null;
  reviewSven: string | null;
}

const REVIEWERS = [
  { key: "martine", label: "Martine" },
  { key: "nathalie", label: "Nathalie" },
  { key: "sven", label: "Sven" },
] as const;

const RESULT_CONFIG: Record<string, { label: string; className: string }> = {
  geschikt: { label: "Geschikt", className: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  niet_weerhouden: { label: "Niet weerhouden", className: "bg-red-100 text-red-800 border-red-300" },
  misschien: { label: "Misschien", className: "bg-amber-100 text-amber-800 border-amber-300" },
};

export default function ReviewPanel({ candidateId, reviewMartine, reviewNathalie, reviewSven }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(submitReview, null);

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state, router]);

  const reviews: Record<string, string | null> = {
    martine: reviewMartine,
    nathalie: reviewNathalie,
    sven: reviewSven,
  };

  const result = computeReviewResult(reviewMartine, reviewNathalie, reviewSven);
  const resultConfig = result ? RESULT_CONFIG[result] : null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Beoordeling</h2>
        {resultConfig && (
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${resultConfig.className}`}>
            Resultaat: {resultConfig.label}
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-gray-500">
        Elke beoordelaar geeft aan of de kandidaat geschikt is. Bij 1x &quot;niet weerhouden&quot; is het eindresultaat
        automatisch &quot;niet weerhouden&quot;. Bij unaniem &quot;geschikt&quot; is het resultaat &quot;geschikt&quot;.
        Anders: &quot;misschien&quot;.
      </p>

      {state && !state.success && (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      )}

      <div className="mt-4 space-y-3">
        {REVIEWERS.map(({ key, label }) => {
          const current = reviews[key];
          return (
            <div key={key} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
              <div>
                <span className="text-sm font-medium text-gray-800">{label}</span>
                {current && (
                  <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    current === "geschikt"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {current === "geschikt" ? "Geschikt" : "Niet weerhouden"}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5">
                <form action={formAction}>
                  <input type="hidden" name="candidateId" value={candidateId} />
                  <input type="hidden" name="reviewer" value={key} />
                  <input type="hidden" name="value" value="geschikt" />
                  <button
                    type="submit"
                    disabled={isPending}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                      current === "geschikt"
                        ? "bg-emerald-600 text-white"
                        : "border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    Geschikt
                  </button>
                </form>
                <form action={formAction}>
                  <input type="hidden" name="candidateId" value={candidateId} />
                  <input type="hidden" name="reviewer" value={key} />
                  <input type="hidden" name="value" value="niet_weerhouden" />
                  <button
                    type="submit"
                    disabled={isPending}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                      current === "niet_weerhouden"
                        ? "bg-red-600 text-white"
                        : "border border-red-300 text-red-700 hover:bg-red-50"
                    }`}
                  >
                    Niet weerhouden
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
