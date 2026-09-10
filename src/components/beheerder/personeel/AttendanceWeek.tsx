"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  addPersonToDay,
  removeAttendance,
  signUpForDay,
} from "@/lib/actions/staff-attendance";
import {
  canRemove,
  displayName,
  formatTimeRange,
  isSignedUp,
  type AttendanceDay,
} from "@/lib/staff/attendance";
import type { ActionResult } from "@/types";

interface Props {
  week: AttendanceDay[];
  weekStart: string;
  prevWeek: string;
  nextWeek: string;
  today: string;
  currentUserId: number | null;
  mayManageOthers: boolean;
}

const TIJD =
  "w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500";

/** De eerste zinnige melding: een veldfout ("Einduur moet na…") gaat voor "Validatie mislukt". */
function melding(state: ActionResult | null): string | null {
  if (!state || state.success) return null;
  const veldfout = state.fieldErrors ? Object.values(state.fieldErrors).flat()[0] : undefined;
  return veldfout ?? state.error ?? null;
}

/**
 * React 19 leegt ongecontroleerde velden ná een Server Action, ook bij een fout. De
 * acties geven de ingevulde waarden terug; die zetten we hier terug, zodat niemand
 * na "Einduur moet na het beginuur liggen" naam en uren opnieuw moet typen.
 */
function herstel(form: HTMLFormElement | null, waarden: Record<string, string> | undefined) {
  if (!form || !waarden) return;
  for (const [naam, waarde] of Object.entries(waarden)) {
    const veld = form.elements.namedItem(naam);
    if (veld instanceof HTMLInputElement || veld instanceof HTMLTextAreaElement) {
      veld.value = waarde;
    }
  }
}

/** Van–tot, twee tijdvelden naast elkaar. Story 14.7. */
function Uren({ dagLabel }: { dagLabel: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <input type="time" name="startTime" step={900} aria-label={`Van (${dagLabel})`} className={TIJD} />
      <span className="text-xs text-gray-400">–</span>
      <input type="time" name="endTime" step={900} aria-label={`Tot (${dagLabel})`} className={TIJD} />
    </div>
  );
}

export default function AttendanceWeek({
  week,
  weekStart,
  prevWeek,
  nextWeek,
  today,
  currentUserId,
  mayManageOthers,
}: Props) {
  const [signUpState, signUpAction, signUpPending] = useActionState(signUpForDay, null);
  const [removeState, removeAction] = useActionState(removeAttendance, null);
  const [addState, addAction] = useActionState(addPersonToDay, null);
  const [addingOn, setAddingOn] = useState<string | null>(null);
  // Story 14.7 — op welke dag het urenformulier openstaat.
  const [urenOp, setUrenOp] = useState<string | null>(null);
  // Er staat telkens hooguit één urenformulier en één vrijwilligersformulier open.
  const urenForm = useRef<HTMLFormElement>(null);
  const addForm = useRef<HTMLFormElement>(null);

  // Geslaagd: formulier dicht. Mislukt: ingevulde waarden terug.
  useEffect(() => {
    if (signUpState?.success) setUrenOp(null);
    else if (signUpState) herstel(urenForm.current, signUpState.values);
  }, [signUpState]);
  useEffect(() => {
    if (addState?.success) setAddingOn(null);
    else if (addState) herstel(addForm.current, addState.values);
  }, [addState]);

  const foutmelding = melding(signUpState) ?? melding(removeState) ?? melding(addState);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Link
            href={`/beheerder/personeel?week=${prevWeek}`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            ← Vorige week
          </Link>
          <Link
            href="/beheerder/personeel"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Deze week
          </Link>
          <Link
            href={`/beheerder/personeel?week=${nextWeek}`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Volgende week →
          </Link>
        </div>
        <p className="text-sm text-gray-500">Week van {weekStart}</p>
      </div>

      {foutmelding && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {foutmelding}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {week.map((day) => {
          const ikKom = isSignedUp(day, currentUserId);
          const isVandaag = day.date === today;

          return (
            <div
              key={day.date}
              className={`rounded-xl border bg-white p-4 shadow-sm ${
                isVandaag ? "border-[#1b4332]" : "border-gray-100"
              }`}
            >
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold capitalize text-[#1b4332]">
                  {day.label}
                  {isVandaag && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                      vandaag
                    </span>
                  )}
                </h2>
                <span className="text-xs text-gray-400 tabular-nums">{day.date.slice(8)}/{day.date.slice(5, 7)}</span>
              </div>

              {day.entries.length === 0 ? (
                <p className="py-2 text-sm text-gray-400">Nog niemand ingeschreven.</p>
              ) : (
                <ul className="mb-2 space-y-1">
                  {day.entries.map((entry) => (
                    <li key={entry.id} className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-gray-700">
                        {displayName(entry)}
                        {entry.userId === null && (
                          <span className="ml-1 text-xs text-gray-400">(vrijwilliger)</span>
                        )}
                        <span className="block text-xs tabular-nums text-gray-500">
                          {formatTimeRange(entry)}
                          {entry.note && <> · {entry.note}</>}
                        </span>
                      </span>
                      {canRemove(entry, currentUserId, mayManageOthers) && (
                        <form action={removeAction}>
                          <input type="hidden" name="id" value={entry.id} />
                          <button
                            type="submit"
                            aria-label={`${displayName(entry)} uitschrijven (${formatTimeRange(entry)})`}
                            className="rounded px-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-red-600"
                          >
                            ✕
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                {urenOp === day.date ? (
                  <form ref={urenForm} action={signUpAction} className="space-y-1.5">
                    <input type="hidden" name="date" value={day.date} />
                    <Uren dagLabel={day.label} />
                    <div className="flex gap-1.5">
                      <button
                        type="submit"
                        disabled={signUpPending}
                        className="flex-1 rounded-md bg-[#1b4332] px-2 py-1 text-xs font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
                      >
                        Ik kom
                      </button>
                      <button
                        type="button"
                        onClick={() => setUrenOp(null)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        Annuleren
                      </button>
                    </div>
                  </form>
                ) : !ikKom ? (
                  <div className="space-y-1">
                    {/* "Ik kom" blijft één klik voor een hele dag; uren zijn een verfijning. */}
                    <form action={signUpAction}>
                      <input type="hidden" name="date" value={day.date} />
                      <button
                        type="submit"
                        disabled={signUpPending}
                        className="w-full rounded-md bg-[#1b4332] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
                      >
                        Ik kom
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => setUrenOp(day.date)}
                      className="w-full text-center text-xs text-[#2d6a4f] hover:underline"
                    >
                      met uren…
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-xs font-medium text-emerald-700">Je staat ingeschreven</p>
                    <button
                      type="button"
                      onClick={() => setUrenOp(day.date)}
                      className="text-xs text-[#2d6a4f] hover:underline"
                    >
                      + nog een blok
                    </button>
                  </div>
                )}

                {mayManageOthers &&
                  (addingOn === day.date ? (
                    <form ref={addForm} action={addAction} className="space-y-1.5">
                      <input type="hidden" name="date" value={day.date} />
                      <input
                        name="guestName"
                        placeholder="Naam vrijwilliger"
                        aria-label={`Naam vrijwilliger voor ${day.label}`}
                        className={TIJD}
                      />
                      <Uren dagLabel={`vrijwilliger ${day.label}`} />
                      <input
                        name="note"
                        placeholder="Toelichting (optioneel)"
                        aria-label={`Toelichting voor ${day.label}`}
                        className={TIJD}
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="submit"
                          className="rounded-md border border-emerald-600 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                        >
                          Toevoegen
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingOn(null)}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          Annuleren
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingOn(day.date)}
                      className="w-full rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      + Iemand anders
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
