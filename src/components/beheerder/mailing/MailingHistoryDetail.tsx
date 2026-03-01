"use client";

import { useState, useEffect } from "react";
import type { MailingSendRecipient } from "@/types";

interface Props {
  sendId: number;
}

export default function MailingHistoryDetail({ sendId }: Props) {
  const [recipients, setRecipients] = useState<MailingSendRecipient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecipients() {
      try {
        const res = await fetch(`/api/mailing/recipients?sendId=${sendId}`);
        if (res.ok) {
          const data = await res.json();
          setRecipients(data);
        }
      } catch {
        // Silently handle fetch errors
      } finally {
        setLoading(false);
      }
    }
    loadRecipients();
  }, [sendId]);

  if (loading) {
    return <p className="text-xs text-gray-500">Laden...</p>;
  }

  if (recipients.length === 0) {
    return <p className="text-xs text-gray-500">Geen ontvangers gevonden.</p>;
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-600">{recipients.length} ontvanger(s):</p>
      <ul className="space-y-0.5">
        {recipients.map((r) => (
          <li key={r.id} className="flex items-center gap-2 text-xs text-gray-600">
            <span className={`inline-block h-2 w-2 rounded-full ${r.status === "sent" ? "bg-emerald-400" : r.status === "failed" ? "bg-red-400" : "bg-gray-300"}`} />
            <span>{r.recipientName}</span>
            <span className="text-gray-400">{r.email}</span>
            {r.animalName && <span className="text-gray-400">({r.animalName})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
