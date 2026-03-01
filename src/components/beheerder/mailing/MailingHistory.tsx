"use client";

import { Fragment, useState } from "react";
import type { MailingSend } from "@/types";
import MailingHistoryDetail from "./MailingHistoryDetail";

interface Props {
  sends: MailingSend[];
}

export default function MailingHistory({ sends }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (sends.length === 0) {
    return (
      <p className="text-sm text-gray-500">Nog geen mailings verstuurd.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Datum</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Onderwerp</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Template</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ontvangers</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {sends.map((send) => (
            <Fragment key={send.id}>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">
                  {new Date(send.createdAt).toLocaleDateString("nl-BE")}
                </td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{send.subject}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{send.templateName}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{send.recipientCount}</td>
                <td className="px-4 py-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === send.id ? null : send.id)}
                    className="text-emerald-600 hover:text-emerald-800 text-xs font-medium"
                  >
                    {expandedId === send.id ? "Verberg" : "Bekijk"}
                  </button>
                </td>
              </tr>
              {expandedId === send.id && (
                <tr>
                  <td colSpan={5} className="bg-gray-50 px-4 py-3">
                    <MailingHistoryDetail sendId={send.id} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
