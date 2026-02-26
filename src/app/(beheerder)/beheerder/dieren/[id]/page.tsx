import { notFound } from "next/navigation";
import { getAnimalById } from "@/lib/queries/animals";
import { getAttachmentsByAnimalId } from "@/lib/queries/attachments";
import { getKennels } from "@/lib/queries/kennels";
import AnimalEditForm from "@/components/beheerder/dieren/AnimalEditForm";
import FileUpload from "@/components/beheerder/shared/FileUpload";
import AttachmentGallery from "@/components/beheerder/dieren/AttachmentGallery";
import KennelSelector from "@/components/beheerder/dieren/KennelSelector";
import StatusChanger from "@/components/beheerder/dieren/StatusChanger";
import OuttakeForm from "@/components/beheerder/dieren/OuttakeForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DierDetailPage({ params }: Props) {
  const { id } = await params;
  const animalId = Number(id);
  if (isNaN(animalId)) notFound();

  const [animal, attachments, kennelsList] = await Promise.all([
    getAnimalById(animalId),
    getAttachmentsByAnimalId(animalId),
    getKennels(),
  ]);

  if (!animal) notFound();

  return (
    <div className="space-y-8">
      <AnimalEditForm animal={animal} />

      {/* Status & Kennel */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-[#1b4332]">
            Status
          </h2>
          <div className="mt-4 max-w-xs">
            <StatusChanger
              animalId={animalId}
              currentStatus={animal.status ?? "beschikbaar"}
            />
          </div>
          <div className="mt-6">
            <OuttakeForm
              animalId={animalId}
              animalName={animal.name}
              isInShelter={animal.isInShelter ?? true}
            />
          </div>
        </div>

        {/* Kennel Toewijzing */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-[#1b4332]">
            Kennel Toewijzing
          </h2>
          <div className="mt-4 max-w-xs">
            <KennelSelector
              animalId={animalId}
              currentKennelId={animal.kennelId}
              kennels={kennelsList}
            />
          </div>
        </div>
      </div>

      {/* Foto's & Bijlagen */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-[#1b4332]">
          Foto&apos;s &amp; Bijlagen
        </h2>

        <div className="mt-4 space-y-6">
          <FileUpload animalId={animalId} />
          <AttachmentGallery
            attachments={attachments}
            currentMainPhoto={animal.imageUrl}
          />
        </div>
      </div>
    </div>
  );
}
