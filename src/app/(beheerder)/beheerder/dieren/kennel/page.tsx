import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import {
  getKennels,
  getKennelOccupancy,
  getAnimalsInKennels,
} from "@/lib/queries/kennels";
import KennelFloorPlan from "@/components/beheerder/dieren/KennelFloorPlan";
import KennelManager from "@/components/beheerder/dieren/KennelManager";

export default async function KennelOverviewPage() {
  const permCheck = await requirePermission("kennel:read");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder");
  }

  const [kennelsList, occupancy, animalsByKennel] = await Promise.all([
    getKennels(),
    getKennelOccupancy(),
    getAnimalsInKennels(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
          Kennel Overzicht
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Klik op een kennel om de bewoners te bekijken.
        </p>
      </div>

      <KennelFloorPlan
        occupancy={occupancy}
        animalsByKennel={animalsByKennel}
      />

      <KennelManager kennels={kennelsList} />
    </div>
  );
}
