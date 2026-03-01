import Link from "next/link";
import CampaignCreateForm from "@/components/beheerder/zwerfkatten/CampaignCreateForm";

export default function NieuweCampagnePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
          Nieuw zwerfkat-verzoek
        </h1>
        <Link
          href="/beheerder/dieren/zwerfkattenbeleid"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Terug naar overzicht
        </Link>
      </div>
      <p className="mb-6 text-sm text-gray-500">
        Registreer een nieuw zwerfkat-verzoek van een gemeente. Velden met * zijn verplicht.
      </p>
      <CampaignCreateForm />
    </div>
  );
}
