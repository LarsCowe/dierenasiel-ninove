"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateWalkerStatus } from "@/lib/actions/walkers";
import type { Walker } from "@/types";

interface Props {
  walker: Walker;
}

export default function WalkerStatusActions({ walker }: Props) {
  const [state, formAction, isPending] = useActionState(updateWalkerStatus, null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  if (walker.status === "rejected") {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="font-heading text-sm font-bold text-[#1b4332]">Acties</h3>

      {state && !state.success && state.error && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {state.message}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {walker.status === "pending" && (
          <>
            {/* Goedkeuren */}
            {confirmAction === "approved" ? (
              <form action={formAction}>
                <input type="hidden" name="walkerId" value={walker.id} />
                <input type="hidden" name="status" value="approved" />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Bevestig goedkeuring?</span>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isPending ? "Bezig..." : "Ja, goedkeuren"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => { setConfirmAction("approved"); setShowRejectForm(false); }}
                className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Goedkeuren
              </button>
            )}

            {/* Afwijzen */}
            {showRejectForm ? (
              <form action={formAction} className="w-full">
                <input type="hidden" name="walkerId" value={walker.id} />
                <input type="hidden" name="status" value="rejected" />
                <div className="mt-2 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Reden voor afwijzing *
                  </label>
                  <textarea
                    name="rejectionReason"
                    required
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Geef een reden op..."
                  />
                  {state && !state.success && state.fieldErrors?.rejectionReason && (
                    <p className="text-sm text-red-600">{state.fieldErrors.rejectionReason[0]}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {isPending ? "Bezig..." : "Bevestig afwijzing"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => { setShowRejectForm(true); setConfirmAction(null); }}
                className="rounded-md border border-red-200 px-5 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Afwijzen
              </button>
            )}
          </>
        )}

        {walker.status === "inactive" && (
          <>
            {confirmAction === "approved" ? (
              <form action={formAction}>
                <input type="hidden" name="walkerId" value={walker.id} />
                <input type="hidden" name="status" value="approved" />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Wandelaar terug activeren?</span>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isPending ? "Bezig..." : "Ja, reactiveren"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmAction("approved")}
                className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Reactiveren
              </button>
            )}
          </>
        )}

        {walker.status === "approved" && (
          <>
            {confirmAction === "inactive" ? (
              <form action={formAction}>
                <input type="hidden" name="walkerId" value={walker.id} />
                <input type="hidden" name="status" value="inactive" />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Bevestig deactivatie?</span>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                  >
                    {isPending ? "Bezig..." : "Ja, deactiveren"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmAction("inactive")}
                className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Inactief zetten
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
