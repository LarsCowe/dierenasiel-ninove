"use client";

import type { MailingRecipient } from "@/types";

interface Props {
  recipients: MailingRecipient[];
  selectedRecipients: MailingRecipient[];
  onSelectionChange: (selected: MailingRecipient[]) => void;
}

export default function RecipientPreviewTable({ recipients, selectedRecipients, onSelectionChange }: Props) {
  const allSelected = selectedRecipients.length === recipients.length;

  function toggleAll() {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...recipients]);
    }
  }

  function toggleRecipient(recipient: MailingRecipient) {
    const isSelected = selectedRecipients.some((r) => r.candidateId === recipient.candidateId);
    if (isSelected) {
      onSelectionChange(selectedRecipients.filter((r) => r.candidateId !== recipient.candidateId));
    } else {
      onSelectionChange([...selectedRecipients, recipient]);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="rounded border-gray-300"
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Naam</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Dier</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Adoptiedatum</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {recipients.map((r) => {
            const isSelected = selectedRecipients.some((s) => s.candidateId === r.candidateId);
            return (
              <tr key={r.candidateId} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRecipient(r)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{r.firstName} {r.lastName}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{r.email}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{r.animalName}</td>
                <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">{r.contractDate}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500">
        {selectedRecipients.length} van {recipients.length} geselecteerd
      </div>
    </div>
  );
}
