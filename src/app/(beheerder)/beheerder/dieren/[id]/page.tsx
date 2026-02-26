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
import BehaviorRecordSection from "@/components/beheerder/dieren/BehaviorRecordSection";
import FeedingPlanSection from "@/components/beheerder/dieren/FeedingPlanSection";
import VaccinationSection from "@/components/beheerder/dieren/VaccinationSection";
import DewormingSection from "@/components/beheerder/dieren/DewormingSection";
import VetVisitSection from "@/components/beheerder/dieren/VetVisitSection";
import OperationSection from "@/components/beheerder/dieren/OperationSection";
import MedicationSection from "@/components/beheerder/dieren/MedicationSection";
import CollapsibleSection from "@/components/beheerder/shared/CollapsibleSection";
import { getBehaviorRecordsByAnimalId, countBehaviorRecords } from "@/lib/queries/behavior-records";
import { getFeedingPlanByAnimalId } from "@/lib/queries/feeding-plans";
import { getVaccinationsByAnimalId } from "@/lib/queries/vaccinations";
import { getDewormingsByAnimalId } from "@/lib/queries/dewormings";
import { getVetVisitsByAnimalId } from "@/lib/queries/vet-visits";
import { getOperationsByAnimalId } from "@/lib/queries/operations";
import { getMedicationsByAnimalId } from "@/lib/queries/medications";

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

  const [animal, attachments, kennelsList, neglectReport, behaviorRecords, behaviorRecordCount, feedingPlan, vaccinationsList, dewormingsList, vetVisitsList, operationsList, medicationsList] = await Promise.all([
    getAnimalById(animalId),
    getAttachmentsByAnimalId(animalId),
    getKennels(),
    getNeglectReportByAnimalId(animalId),
    getBehaviorRecordsByAnimalId(animalId),
    countBehaviorRecords(animalId),
    getFeedingPlanByAnimalId(animalId),
    getVaccinationsByAnimalId(animalId),
    getDewormingsByAnimalId(animalId),
    getVetVisitsByAnimalId(animalId),
    getOperationsByAnimalId(animalId),
    getMedicationsByAnimalId(animalId),
  ]);

  if (!animal) notFound();

  return (
    <div className="space-y-4">
      <AnimalEditForm animal={animal} />

      {/* Status & Kennel */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-[#1b4332]">Status</h2>
          <div className="mt-2">
            <StatusChanger
              animalId={animalId}
              currentStatus={animal.status ?? "beschikbaar"}
            />
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-[#1b4332]">Kennel</h2>
          <div className="mt-2">
            <KennelSelector
              animalId={animalId}
              currentKennelId={animal.kennelId}
              kennels={kennelsList}
            />
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-[#1b4332]">Uitstroom</h2>
          <div className="mt-2">
            <OuttakeForm
              animalId={animalId}
              animalName={animal.name}
              isInShelter={animal.isInShelter ?? true}
            />
          </div>
        </div>
      </div>

      {/* IBN Info */}
      {animal.intakeReason === "ibn" && (
        <CollapsibleSection title="Inbeslagname (IBN)" defaultOpen variant="danger">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
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
        </CollapsibleSection>
      )}

      {/* Gedragsfiches */}
      <CollapsibleSection title="Gedragsfiches">
        <BehaviorRecordSection
          animalId={animalId}
          species={animal.species}
          records={behaviorRecords}
          recordCount={behaviorRecordCount}
        />
      </CollapsibleSection>

      {/* Voedingsplan */}
      <CollapsibleSection title="Voedingsplan">
        <FeedingPlanSection animalId={animalId} plan={feedingPlan} />
      </CollapsibleSection>

      {/* Medische fiche */}
      <CollapsibleSection title="Medische fiche">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Vaccinaties</h3>
          <div className="mt-2">
            <VaccinationSection animalId={animalId} vaccinations={vaccinationsList} />
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ontwormingen</h3>
          <div className="mt-2">
            <DewormingSection animalId={animalId} dewormings={dewormingsList} />
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Dierenarts-bezoeken</h3>
          <div className="mt-2">
            <VetVisitSection animalId={animalId} visits={vetVisitsList} />
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Operaties</h3>
          <div className="mt-2">
            <OperationSection animalId={animalId} operations={operationsList} />
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Medicatie</h3>
          <div className="mt-2">
            <MedicationSection animalId={animalId} medications={medicationsList} />
          </div>
        </div>
      </CollapsibleSection>

      {/* Foto's & Bijlagen */}
      <CollapsibleSection title={"Foto's & Bijlagen"}>
        <div className="space-y-6">
          <FileUpload animalId={animalId} />
          <AttachmentGallery
            attachments={attachments}
            currentMainPhoto={animal.imageUrl}
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}
