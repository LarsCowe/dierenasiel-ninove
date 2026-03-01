"use client";

import { useState, useTransition, useEffect } from "react";
import {
  getRetentionOverviewAction,
  runRetentionCheckAction,
  extendRetentionAction,
  anonymizeCandidateAction,
  anonymizeWalkerAction,
} from "@/app/(beheerder)/beheerder/gdpr/actions";

interface FlaggedRecord {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date | string;
  retentionFlaggedAt: Date | string | null;
}

interface RetentionData {
  flaggedCandidates: FlaggedRecord[];
  flaggedWalkers: FlaggedRecord[];
  summary: {
    flaggedCandidates: number;
    flaggedWalkers: number;
    totalFlagged: number;
  };
}

export default function RetentionOverview() {
  const [data, setData] = useState<RetentionData | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [isChecking, startChecking] = useTransition();
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [extendReason, setExtendReason] = useState("");
  const [isExtending, startExtending] = useTransition();
  const [isAnonymising, startAnonymising] = useTransition();

  function loadData() {
    startLoading(async () => {
      const result = await getRetentionOverviewAction();
      if (result.success) {
        setData(result.data);
      } else {
        setMessage({ type: "error", text: result.error ?? "Laden mislukt." });
      }
    });
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRunCheck() {
    startChecking(async () => {
      setMessage(null);
      const result = await runRetentionCheckAction();
      if (result.success) {
        setMessage({ type: "success", text: result.message ?? "Controle voltooid." });
        loadData();
      } else {
        setMessage({ type: "error", text: result.error ?? "Controle mislukt." });
      }
    });
  }

  function handleExtend(entityType: "candidate" | "walker", entityId: number) {
    if (!extendReason.trim()) {
      setMessage({ type: "error", text: "Vul een reden in voor de verlenging." });
      return;
    }
    startExtending(async () => {
      setMessage(null);
      const result = await extendRetentionAction(entityType, entityId, extendReason.trim());
      if (result.success) {
        setMessage({ type: "success", text: result.message ?? "Bewaartermijn verlengd." });
        setExtendingId(null);
        setExtendReason("");
        loadData();
      } else {
        setMessage({ type: "error", text: result.error ?? "Verlengen mislukt." });
      }
    });
  }

  function handleAnonymise(entityType: "candidate" | "walker", entityId: number) {
    const label = entityType === "candidate" ? "adoptant" : "wandelaar";
    if (!window.confirm(`Weet je zeker dat je deze ${label} wilt anonimiseren? Dit is onomkeerbaar.`)) {
      return;
    }
    startAnonymising(async () => {
      setMessage(null);
      const result =
        entityType === "candidate"
          ? await anonymizeCandidateAction(entityId)
          : await anonymizeWalkerAction(entityId);
      if (result.success) {
        setMessage({ type: "success", text: result.message ?? "Geanonimiseerd." });
        loadData();
      } else {
        setMessage({ type: "error", text: result.error ?? "Anonimisatie mislukt." });
      }
    });
  }

  const formatDate = (d: Date | string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("nl-BE");
  };

  const recordKey = (type: string, id: number) => `${type}-${id}`;

  function FlaggedRecordRow({
    record,
    entityType,
    typeLabel,
  }: {
    record: FlaggedRecord;
    entityType: "candidate" | "walker";
    typeLabel: string;
  }) {
    const key = recordKey(entityType, record.id);
    return (
      <tr>
        <td className="px-4 py-2 text-gray-500">{typeLabel}</td>
        <td className="px-4 py-2 font-medium text-gray-900">
          {record.firstName} {record.lastName}
        </td>
        <td className="px-4 py-2 text-gray-600">{record.email}</td>
        <td className="px-4 py-2 text-gray-600">{formatDate(record.createdAt)}</td>
        <td className="px-4 py-2 text-gray-600">{formatDate(record.retentionFlaggedAt)}</td>
        <td className="px-4 py-2">
          {extendingId === key ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Reden verlenging"
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => handleExtend(entityType, record.id)}
                disabled={isExtending}
                className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isExtending ? "..." : "OK"}
              </button>
              <button
                type="button"
                onClick={() => { setExtendingId(null); setExtendReason(""); }}
                className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300"
              >
                Annuleer
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAnonymise(entityType, record.id)}
                disabled={isAnonymising}
                className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
              >
                Anonimiseren
              </button>
              <button
                type="button"
                onClick={() => {
                  setExtendingId(key);
                  setExtendReason("");
                }}
                className="rounded bg-amber-500 px-2 py-1 text-xs text-white hover:bg-amber-600"
              >
                Verlengen
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary + Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {isLoading ? (
            "Laden..."
          ) : data ? (
            <span>
              <strong>{data.summary.totalFlagged}</strong> record(s) gemarkeerd
              ({data.summary.flaggedCandidates} adoptanten, {data.summary.flaggedWalkers} wandelaars)
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleRunCheck}
          disabled={isChecking}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isChecking ? "Controleren..." : "Handmatig controleren"}
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Flagged Records Table */}
      {data && data.summary.totalFlagged > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Type</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Naam</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">E-mail</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Aangemaakt</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Gemarkeerd</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.flaggedCandidates.map((c) => (
                <FlaggedRecordRow key={`c-${c.id}`} record={c} entityType="candidate" typeLabel="Adoptant" />
              ))}
              {data.flaggedWalkers.map((w) => (
                <FlaggedRecordRow key={`w-${w.id}`} record={w} entityType="walker" typeLabel="Wandelaar" />
              ))}
            </tbody>
          </table>
        </div>
      ) : data && data.summary.totalFlagged === 0 ? (
        <p className="text-sm text-gray-500">
          Geen records met overschreden bewaartermijn gevonden.
        </p>
      ) : null}
    </div>
  );
}
