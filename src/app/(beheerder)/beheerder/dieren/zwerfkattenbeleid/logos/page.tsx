import Link from "next/link";
import { getMunicipalityLogos } from "@/lib/queries/municipality-logos";
import LogoLibraryGrid from "@/components/beheerder/zwerfkatten/LogoLibraryGrid";

export default async function LogoLibraryPage() {
  const logos = await getMunicipalityLogos();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
            Gemeente-logo's
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Bibliotheek van gemeente-logo's voor zwerfkat-campagnes.
          </p>
        </div>
        <Link
          href="/beheerder/dieren/zwerfkattenbeleid"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Terug naar campagnes
        </Link>
      </div>

      <LogoLibraryGrid logos={logos} />
    </div>
  );
}
