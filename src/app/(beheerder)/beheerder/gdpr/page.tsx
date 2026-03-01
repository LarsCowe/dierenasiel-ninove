import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import GdprPersonSearch from "@/components/beheerder/gdpr/GdprPersonSearch";

export default async function GdprPage() {
  const permCheck = await requirePermission("gdpr:read");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">GDPR & Privacy</h1>
        <p className="mt-1 text-sm text-gray-500">
          Beheer persoonsgegevens conform de AVG/GDPR. Zoek een persoon om gegevens te bekijken of te anonimiseren.
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-800">Persoon zoeken</h2>
        <p className="mt-1 text-sm text-gray-500">
          Zoek op naam of e-mailadres in adoptanten en wandelaars.
        </p>
        <div className="mt-4">
          <GdprPersonSearch />
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-semibold text-amber-800">Belangrijk</h2>
        <ul className="mt-2 space-y-1 text-sm text-amber-700">
          <li>Anonimisatie is onomkeerbaar — persoonsgegevens worden permanent gewist.</li>
          <li>Gerelateerde records (contracten, wandelingen) blijven intact.</li>
          <li>Alle acties worden gelogd voor traceerbaarheid.</li>
        </ul>
      </section>
    </div>
  );
}
