import Link from "next/link";
import { getCages } from "@/lib/queries/cages";
import { getOccupiedCageNumbers } from "@/lib/queries/stray-cat-campaigns";
import CageManagementGrid from "@/components/beheerder/zwerfkatten/CageManagementGrid";

export default async function CageManagementPage() {
  const [cages, occupied] = await Promise.all([
    getCages(),
    getOccupiedCageNumbers(),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
            Kooien
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Bibliotheek van kooien voor zwerfkat-campagnes.
          </p>
        </div>
        <Link
          href="/beheerder/dieren/zwerfkattenbeleid"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Terug naar campagnes
        </Link>
      </div>

      <CageManagementGrid cages={cages} occupied={occupied} />
    </div>
  );
}
