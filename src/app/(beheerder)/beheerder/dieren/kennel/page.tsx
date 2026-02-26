import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import {
  getKennelOccupancy,
  getAnimalsInKennels,
} from "@/lib/queries/kennels";
import KennelFloorPlan from "@/components/beheerder/dieren/KennelFloorPlan";

export default async function KennelOverviewPage() {
  const permCheck = await requirePermission("kennel:read");
  if (permCheck && !permCheck.success) {
    redirect("/beheerder");
  }

  const [occupancy, animalsByKennel] = await Promise.all([
    getKennelOccupancy(),
    getAnimalsInKennels(),
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        Kennel Overzicht
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Klik op een kennel om de bewoners te bekijken.
      </p>

      <div className="mt-6">
        <KennelFloorPlan
          occupancy={occupancy}
          animalsByKennel={animalsByKennel}
        />
      </div>
    </div>
  );
}
