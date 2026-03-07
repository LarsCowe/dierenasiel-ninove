import { db } from "@/lib/db";
import { animals } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import PublicAdoptionForm from "@/components/adoptie/PublicAdoptionForm";

export default async function HondAdoptieAanvraagPage() {
  const adoptableDogs = await db
    .select({ id: animals.id, name: animals.name })
    .from(animals)
    .where(
      and(
        eq(animals.species, "hond"),
        eq(animals.isAvailableForAdoption, true),
      ),
    )
    .orderBy(asc(animals.name));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#d8f3dc] to-white px-4 py-8">
      <PublicAdoptionForm
        species="hond"
        adoptableAnimals={adoptableDogs.map((d) => d.name)}
      />
    </div>
  );
}
