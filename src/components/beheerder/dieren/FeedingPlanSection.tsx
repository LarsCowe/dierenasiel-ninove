"use client";

import { useState } from "react";
import FeedingPlanForm from "./FeedingPlanForm";
import type { FeedingPlan, FeedingQuestionnaire } from "@/types";

interface FeedingPlanSectionProps {
  animalId: number;
  plan: FeedingPlan | null;
}

function FeedingPlanView({
  plan,
  onEdit,
}: {
  plan: FeedingPlan;
  onEdit: () => void;
}) {
  const q = plan.questionnaire as FeedingQuestionnaire;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <p className="text-xs font-medium text-gray-500">Dieet type</p>
          <p className="mt-1 text-sm font-semibold text-gray-800">
            {q.dieetType ? q.dieetType.charAt(0).toUpperCase() + q.dieetType.slice(1) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Merk</p>
          <p className="mt-1 text-sm text-gray-800">{q.merk || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Hoeveelheid</p>
          <p className="mt-1 text-sm text-gray-800">{q.hoeveelheid || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Frequentie</p>
          <p className="mt-1 text-sm text-gray-800">{q.frequentie || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Allergieën</p>
          <p className="mt-1 text-sm text-gray-800">
            {q.allergieen?.length ? q.allergieen.join(", ") : "Geen"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Specifieke behoeften</p>
          <p className="mt-1 text-sm text-gray-800">{q.specifiekeBehoeften || "—"}</p>
        </div>
      </div>

      {plan.notes && (
        <div>
          <p className="text-xs font-medium text-gray-500">Opmerkingen</p>
          <p className="mt-1 text-sm text-gray-800">{plan.notes}</p>
        </div>
      )}

      {plan.updatedAt && (
        <p className="text-xs text-gray-400">
          Laatst bijgewerkt: {new Date(plan.updatedAt).toLocaleDateString("nl-BE")}
        </p>
      )}

      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Bewerken
      </button>
    </div>
  );
}

export default function FeedingPlanSection({ animalId, plan }: FeedingPlanSectionProps) {
  const [editing, setEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  if (!plan) {
    return (
      <div>
        {showForm ? (
          <FeedingPlanForm animalId={animalId} onCancel={() => setShowForm(false)} />
        ) : (
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">Geen voedingsplan ingevuld</p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-[#1b4332] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2d6a4f]"
            >
              Voedingsplan aanmaken
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {editing ? (
        <FeedingPlanForm
          animalId={animalId}
          existingPlan={plan}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <FeedingPlanView plan={plan} onEdit={() => setEditing(true)} />
      )}
    </div>
  );
}
