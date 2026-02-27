import Link from "next/link";
import { getActiveMedicationsWithTodayStatus } from "@/lib/queries/medication-logs";
import ComplianceHeader from "@/components/beheerder/medisch/ComplianceHeader";
import AnimalMedicationCard from "@/components/beheerder/medisch/AnimalMedicationCard";

export default async function MedischOverzichtPage() {
  const medicationsWithStatus = await getActiveMedicationsWithTodayStatus();

  // Group by animal
  const byAnimal = new Map<number, typeof medicationsWithStatus>();
  for (const item of medicationsWithStatus) {
    const key = item.animal.id;
    if (!byAnimal.has(key)) byAnimal.set(key, []);
    byAnimal.get(key)!.push(item);
  }

  const totalMeds = medicationsWithStatus.length;
  const checkedMeds = medicationsWithStatus.filter((m) => m.todayLog !== null).length;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        Medisch Overzicht
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Dagelijkse medicatie afvinken voor alle dieren.
      </p>

      <div className="mt-4">
        <Link
          href="/beheerder/medisch/bezoekrapport"
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-sm transition-colors hover:bg-emerald-100"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Bezoekrapporten contractdierenarts
        </Link>
      </div>

      <div className="mt-6">
        <ComplianceHeader total={totalMeds} checked={checkedMeds} />
      </div>

      <div className="mt-6 space-y-4">
        {Array.from(byAnimal.entries()).map(([animalId, items]) => (
          <AnimalMedicationCard
            key={animalId}
            animal={items[0].animal}
            medications={items}
          />
        ))}
        {medicationsWithStatus.length === 0 && (
          <div className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Er zijn momenteel geen actieve medicaties.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
