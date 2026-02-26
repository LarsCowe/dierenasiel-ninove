import MedicationCheckoff from "./MedicationCheckoff";
import type { MedicationWithTodayStatus } from "@/lib/queries/medication-logs";

interface AnimalMedicationCardProps {
  animal: MedicationWithTodayStatus["animal"];
  medications: MedicationWithTodayStatus[];
}

export default function AnimalMedicationCard({ animal, medications }: AnimalMedicationCardProps) {
  const checked = medications.filter((m) => m.todayLog !== null).length;
  const total = medications.length;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1b4332] text-xs font-bold text-white">
            {animal.species === "hond" ? "H" : animal.species === "kat" ? "K" : "A"}
          </span>
          <h3 className="font-heading text-sm font-bold text-[#1b4332]">
            {animal.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            checked === total
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}>
            {checked}/{total} afgevinkt
          </span>
        </div>
      </div>
      <div className="space-y-2 p-4">
        {medications.map((item) => (
          <MedicationCheckoff
            key={item.medication.id}
            medicationId={item.medication.id}
            medicationName={item.medication.medicationName}
            dosage={item.medication.dosage}
            quantity={item.medication.quantity}
            notes={item.medication.notes}
            todayLog={item.todayLog}
          />
        ))}
      </div>
    </div>
  );
}
