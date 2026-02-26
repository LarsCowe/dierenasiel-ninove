"use client";

import { useActionState } from "react";
import { deleteOperation } from "@/lib/actions/operations";
import type { Operation } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  steriliseren: "Steriliseren",
  castreren: "Castreren",
  tanden_opkuisen: "Tanden opkuisen",
  gezwel_weghalen: "Gezwel weghalen",
};

interface OperationListProps {
  operations: Operation[];
}

export default function OperationList({ operations }: OperationListProps) {
  if (operations.length === 0) {
    return <p className="text-sm text-gray-500">Nog geen operaties geregistreerd.</p>;
  }

  return (
    <div className="space-y-2">
      {operations.map((op) => (
        <OperationRow key={op.id} operation={op} />
      ))}
    </div>
  );
}

function OperationRow({ operation }: { operation: Operation }) {
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteOperation, null);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              {TYPE_LABELS[operation.type] ?? operation.type}
            </span>
            <span className="text-sm font-medium text-gray-800">{operation.date}</span>
          </div>
          {operation.notes && (
            <p className="text-xs text-gray-500">{operation.notes}</p>
          )}
          {deleteState && !deleteState.success && (
            <p className="text-xs text-red-600">{deleteState.error}</p>
          )}
        </div>
        <form action={deleteAction}>
          <input type="hidden" name="id" value={operation.id} />
          <button
            type="submit"
            disabled={isDeleting}
            className="text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            {isDeleting ? "..." : "Verwijderen"}
          </button>
        </form>
      </div>
    </div>
  );
}
