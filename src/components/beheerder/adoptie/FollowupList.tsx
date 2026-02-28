"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateFollowupStatus, createCustomFollowup } from "@/lib/actions/post-adoption-followups";
import { daysUntil, urgencyColor, deadlineLabel } from "@/lib/utils/date";
import type { PostAdoptionFollowup } from "@/types";

interface Props {
  followups: PostAdoptionFollowup[];
  contractId: number;
}

const TYPE_LABELS: Record<string, string> = {
  "1_week": "1 week",
  "1_month": "1 maand",
  custom: "Extra",
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Gepland",
  completed: "Afgerond",
  no_response: "Geen reactie",
};

function StatusBadge({ status }: { status: string }) {
  const colors =
    status === "completed"
      ? "bg-emerald-100 text-emerald-800"
      : status === "no_response"
        ? "bg-amber-100 text-amber-800"
        : "bg-blue-100 text-blue-800";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function FollowupRow({ followup }: { followup: PostAdoptionFollowup }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [updateState, updateAction, updatePending] = useActionState(updateFollowupStatus, null);

  useEffect(() => {
    if (updateState?.success) {
      router.refresh();
    }
  }, [updateState, router]);

  const days = daysUntil(followup.date);
  const isPlanned = followup.status === "planned";

  function handleSubmit(status: "completed" | "no_response") {
    const fd = new FormData();
    fd.append("json", JSON.stringify({ id: followup.id, status, notes: notes || undefined }));
    updateAction(fd);
  }

  return (
    <div className={`rounded-lg border p-4 ${
      !isPlanned ? "border-gray-100 bg-gray-50" : days <= 0 ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-800">
            {TYPE_LABELS[followup.followupType] ?? followup.followupType}
          </span>
          <StatusBadge status={followup.status} />
          {isPlanned && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${urgencyColor(days)}`}>
              {deadlineLabel(days)}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {new Date(followup.date).toLocaleDateString("nl-BE")}
        </span>
      </div>

      {followup.notes && !isPlanned && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{followup.notes}</p>
      )}

      {isPlanned && (
        <div className="mt-3 space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notities (optioneel)..."
            maxLength={5000}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={updatePending}
              onClick={() => handleSubmit("completed")}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {updatePending ? "Opslaan..." : "Afgerond"}
            </button>
            <button
              type="button"
              disabled={updatePending}
              onClick={() => handleSubmit("no_response")}
              className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              Geen reactie
            </button>
          </div>

          {updateState && !updateState.success && (
            <p className="text-sm text-red-600">{updateState.error}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function FollowupList({ followups, contractId }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [createState, createAction, createPending] = useActionState(createCustomFollowup, null);

  useEffect(() => {
    if (createState?.success) {
      setShowForm(false);
      setCustomDate("");
      setCustomNotes("");
      router.refresh();
    }
  }, [createState, router]);

  function handleCreate() {
    const fd = new FormData();
    fd.append("json", JSON.stringify({ contractId, date: customDate, notes: customNotes || undefined }));
    createAction(fd);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-bold text-[#1b4332]">Post-adoptie opvolgingen</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
        >
          + Extra opvolging
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">Datum</label>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Notities (optioneel)</label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              maxLength={5000}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={createPending || !customDate}
              onClick={handleCreate}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {createPending ? "Opslaan..." : "Toevoegen"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Annuleren
            </button>
          </div>
          {createState && !createState.success && (
            <p className="text-sm text-red-600">{createState.error}</p>
          )}
        </div>
      )}

      {followups.length === 0 ? (
        <p className="text-sm text-gray-500">Geen opvolgingen gepland.</p>
      ) : (
        <div className="space-y-3">
          {followups.map((f) => (
            <FollowupRow key={f.id} followup={f} />
          ))}
        </div>
      )}
    </div>
  );
}
