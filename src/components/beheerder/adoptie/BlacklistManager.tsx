"use client";

import { useState, useCallback } from "react";
import BlacklistTable from "./BlacklistTable";
import BlacklistForm from "./BlacklistForm";
import type { BlacklistEntry } from "@/types";

interface Props {
  entries: BlacklistEntry[];
}

export default function BlacklistManager({ entries }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<BlacklistEntry | null>(null);

  const handleEdit = useCallback((entry: BlacklistEntry) => {
    setEditEntry(entry);
    setShowForm(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowForm(false);
    setEditEntry(null);
  }, []);

  const handleAdd = useCallback(() => {
    setEditEntry(null);
    setShowForm(true);
  }, []);

  return (
    <div className="space-y-6">
      {!showForm && (
        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            className="rounded-md bg-[#1b4332] px-5 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f]"
          >
            Toevoegen
          </button>
        </div>
      )}

      {showForm && (
        <BlacklistForm key={editEntry?.id ?? "new"} editEntry={editEntry} onClose={handleClose} />
      )}

      <BlacklistTable entries={entries} onEdit={handleEdit} />
    </div>
  );
}
