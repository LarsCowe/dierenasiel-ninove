"use client";

import { useState } from "react";
import { sendMailingActionWrapper } from "@/app/(beheerder)/beheerder/mailing/actions";
import { MAILING_TEMPLATES } from "@/lib/constants";
import type { MailingRecipient } from "@/types";
import type { MailingTemplateId } from "@/lib/constants";

interface Props {
  recipients: MailingRecipient[];
}

export default function SendMailForm({ recipients }: Props) {
  const [templateName, setTemplateName] = useState<MailingTemplateId>("follow_up_1_week");
  const [subject, setSubject] = useState("Opvolging na adoptie — Dierenasiel Ninove");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  async function handleSend() {
    if (recipients.length === 0) return;
    setSending(true);
    setResult(null);

    const res = await sendMailingActionWrapper({
      recipients,
      subject,
      templateName,
    });

    if (res.success) {
      setResult({ success: true, message: res.message || `${res.data.sentCount} mail(s) verstuurd.` });
    } else {
      setResult({ success: false, error: res.error || "Er ging iets mis." });
    }
    setSending(false);
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Mail versturen</h3>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="template" className="block text-xs font-medium text-gray-600">Template</label>
          <select
            id="template"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value as MailingTemplateId)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            {MAILING_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="subject" className="block text-xs font-medium text-gray-600">Onderwerp</label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || recipients.length === 0}
          className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {sending ? "Versturen..." : `Verstuur naar ${recipients.length} ontvanger(s)`}
        </button>
        {recipients.length === 0 && (
          <span className="text-xs text-amber-600">Selecteer minstens één ontvanger.</span>
        )}
      </div>

      {result && (
        <div className={`rounded-md p-3 text-sm ${result.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {result.success ? result.message : result.error}
        </div>
      )}
    </div>
  );
}
