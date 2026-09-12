import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import { getAnimalById } from "@/lib/queries/animals";
import { prefillFromAnimal } from "@/lib/animals/owner-return";
import OwnerReturnForm from "@/components/beheerder/dieren/OwnerReturnForm";
import { todayInBrussels } from "@/lib/validations/animal-weights";

interface Props {
  params: Promise<{ id: string }>;
}

/** Story 10.64 — nieuw formulier "Terug naar eigenaar" voor dit dier. */
export default async function NieuwTerugNaarEigenaarPage({ params }: Props) {
  const { id } = await params;
  const animalId = Number(id);
  if (isNaN(animalId)) notFound();

  const permCheck = await requirePermission("animal:write");
  if (permCheck && !permCheck.success) redirect(`/beheerder/dieren/${animalId}`);

  const animal = await getAnimalById(animalId);
  if (!animal) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href={`/beheerder/dieren/${animalId}`} className="text-sm text-[#2d6a4f] hover:underline">
        ← Terug naar {animal.name}
      </Link>
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1b4332]">Terug naar eigenaar — {animal.name}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vul het formulier in met de eigenaar. Daarna kan je het afdrukken om te laten tekenen, de getekende
          versie opladen en een kopie mailen.
        </p>
      </div>
      <OwnerReturnForm animalId={animalId} prefill={prefillFromAnimal(animal)} today={todayInBrussels()} />
    </div>
  );
}
