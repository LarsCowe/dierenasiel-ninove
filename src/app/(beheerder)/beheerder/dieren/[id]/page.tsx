import { notFound } from "next/navigation";
import { getAnimalById } from "@/lib/queries/animals";
import { getAttachmentsByAnimalId } from "@/lib/queries/attachments";
import { getKennels } from "@/lib/queries/kennels";
import { getNeglectReportByAnimalId } from "@/lib/queries/neglect-reports";
import AnimalEditForm from "@/components/beheerder/dieren/AnimalEditForm";
import FileUpload from "@/components/beheerder/shared/FileUpload";
import AttachmentGallery from "@/components/beheerder/dieren/AttachmentGallery";
import KennelSelector from "@/components/beheerder/dieren/KennelSelector";
import StatusChanger from "@/components/beheerder/dieren/StatusChanger";
import OuttakeForm from "@/components/beheerder/dieren/OuttakeForm";
import NeglectReportSection from "@/components/beheerder/dieren/NeglectReportSection";

function IbnMetadata({ metadata }: { metadata: unknown }) {
  if (!metadata || typeof metadata !== "object") return null;
  const meta = metadata as Record<string, string>;
  return (
    <div className="mt-4 border-t border-red-200 pt-4">
      <p className="text-xs font-medium text-gray-500">Betrokken instanties</p>
      <p className="mt-1 text-sm text-gray-800">
        {meta.betrokkenInstanties || "Niet opgegeven"}
      </p>
    </div>
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DierDetailPage({ params }: Props) {
  const { id } = await params;
  const animalId = Number(id);
  if (isNaN(animalId)) notFound();

  const [animal, attachments, kennelsList, neglectReport] = await Promise.all([
    getAnimalById(animalId),
    getAttachmentsByAnimalId(animalId),
    getKennels(),
    getNeglectReportByAnimalId(animalId),
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

      {/* IBN Info */}
      {animal.intakeReason === "ibn" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-red-800">
            Inbeslagname (IBN)
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-gray-500">Dossiernummer DWV</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {animal.dossierNr || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">PV-nummer politie</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {animal.pvNr || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Intake datum</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {animal.intakeDate || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Beslissingsdeadline (60d)</p>
              <p className={`mt-1 text-sm font-semibold ${
                animal.ibnDecisionDeadline &&
                new Date(animal.ibnDecisionDeadline) <= new Date()
                  ? "text-red-700"
                  : "text-gray-800"
              }`}>
                {animal.ibnDecisionDeadline || "—"}
              </p>
            </div>
          </div>
          <IbnMetadata metadata={animal.intakeMetadata} />
          <NeglectReportSection animalId={animalId} report={neglectReport} />
        </div>
      )}

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
