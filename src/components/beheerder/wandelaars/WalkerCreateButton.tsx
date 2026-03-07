"use client";

import { useState } from "react";
import WalkerCreateForm from "./WalkerCreateForm";

export default function WalkerCreateButton() {
  const [showForm, setShowForm] = useState(false);

  if (showForm) {
    return <WalkerCreateForm onClose={() => setShowForm(false)} />;
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="rounded-md bg-[#1b4332] px-5 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f]"
    >
      Nieuwe wandelaar
    </button>
  );
}
