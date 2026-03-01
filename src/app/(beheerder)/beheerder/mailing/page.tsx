import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import { getMailingSends } from "@/lib/queries/mailing";
import MailingListGenerator from "@/components/beheerder/mailing/MailingListGenerator";
import MailingHistory from "@/components/beheerder/mailing/MailingHistory";

export default async function MailingPage() {
  const permCheck = await requirePermission("adoption:read");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder");
  }

  const sends = await getMailingSends();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mailing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Genereer mailinglijsten van adoptanten en verstuur opvolgingsmails.
        </p>
      </div>

      {/* Generate mailing list section */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-800">Mailinglijst genereren</h2>
        <p className="mt-1 text-sm text-gray-500">
          Selecteer filters om een lijst van adoptanten te genereren.
        </p>
        <div className="mt-4">
          <Suspense>
            <MailingListGenerator />
          </Suspense>
        </div>
      </section>

      {/* Mailing history section */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-800">Verzendhistorie</h2>
        <p className="mt-1 text-sm text-gray-500">
          Overzicht van alle verzonden mailings.
        </p>
        <div className="mt-4">
          <MailingHistory sends={sends} />
        </div>
      </section>
    </div>
  );
}
