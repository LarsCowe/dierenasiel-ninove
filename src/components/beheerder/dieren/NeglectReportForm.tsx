"use client";

import { useActionState, useState, useRef } from "react";
import { createNeglectReport, updateNeglectReport } from "@/lib/actions/neglect-reports";
import type { NeglectReport } from "@/types";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/validations/attachments";

const IMAGE_MIME_TYPES = ALLOWED_MIME_TYPES.filter((t) => t.startsWith("image/"));
const ACCEPT_STRING = IMAGE_MIME_TYPES.join(",");

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p role="alert" className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

interface NeglectReportFormProps {
  animalId: number;
  existingReport?: NeglectReport | null;
  onCancel?: () => void;
}

export default function NeglectReportForm({
  animalId,
  existingReport,
  onCancel,
}: NeglectReportFormProps) {
  const isEdit = !!existingReport;
  const action = isEdit ? updateNeglectReport : createNeglectReport;
  const [state, formAction, isPending] = useActionState(action, null);

  const [photos, setPhotos] = useState<string[]>(existingReport?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const globalError = state && !state.success ? state.error : undefined;

  async function handlePhotoUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploadError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (!IMAGE_MIME_TYPES.includes(file.type as typeof IMAGE_MIME_TYPES[number])) {
          setUploadError(`"${file.name}" is geen geldig afbeeldingstype.`);
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          setUploadError(`"${file.name}" is te groot (max 50MB).`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("animalId", String(animalId));
        formData.append("context", "verwaarlozing");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const body = await response.json();
          setUploadError(body.error || "Upload mislukt");
          continue;
        }

        const body = await response.json();
        if (body.success && body.data?.fileUrl) {
          setPhotos((prev) => [...prev, body.data.fileUrl]);
        }
      }
    } catch {
      setUploadError("Er ging iets mis bij het uploaden.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">
            Rapport succesvol {isEdit ? "bijgewerkt" : "opgeslagen"}!
          </p>
        </div>
      )}

      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{globalError}</p>
        </div>
      )}

      <input type="hidden" name="animalId" value={animalId} />
      {isEdit && <input type="hidden" name="id" value={existingReport!.id} />}
      <input type="hidden" name="photos" value={JSON.stringify(photos)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nr-date" className="block text-sm font-medium text-gray-700">
            Datum onderzoek
          </label>
          <input
            type="date"
            id="nr-date"
            name="date"
            defaultValue={existingReport?.date ?? ""}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="nr-vetName" className="block text-sm font-medium text-gray-700">
            Naam dierenarts
          </label>
          <input
            type="text"
            id="nr-vetName"
            name="vetName"
            defaultValue={existingReport?.vetName ?? ""}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="nr-healthStatus" className="block text-sm font-medium text-gray-700">
          Gezondheidstoestand bij aankomst <span className="text-red-500">*</span>
        </label>
        <textarea
          id="nr-healthStatus"
          name="healthStatusOnArrival"
          required
          rows={3}
          defaultValue={existingReport?.healthStatusOnArrival ?? ""}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          placeholder="Beschrijf de gezondheidstoestand bij aankomst..."
        />
        <FieldError errors={fieldErrors?.healthStatusOnArrival} />
      </div>

      <div>
        <label htmlFor="nr-neglectFindings" className="block text-sm font-medium text-gray-700">
          Vaststellingen verwaarlozing <span className="text-red-500">*</span>
        </label>
        <textarea
          id="nr-neglectFindings"
          name="neglectFindings"
          required
          rows={3}
          defaultValue={existingReport?.neglectFindings ?? ""}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          placeholder="Beschrijf de vaststellingen van verwaarlozing..."
        />
        <FieldError errors={fieldErrors?.neglectFindings} />
      </div>

      <div>
        <label htmlFor="nr-treatments" className="block text-sm font-medium text-gray-700">
          Uitgevoerde behandelingen
        </label>
        <textarea
          id="nr-treatments"
          name="treatmentsGiven"
          rows={2}
          defaultValue={existingReport?.treatmentsGiven ?? ""}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          placeholder="Infuus, medicatie, wondverzorging..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nr-weight" className="block text-sm font-medium text-gray-700">
            Gewicht bij aankomst
          </label>
          <input
            type="text"
            id="nr-weight"
            name="weightOnArrival"
            defaultValue={existingReport?.weightOnArrival ?? ""}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
            placeholder="bv. 4.5 kg"
          />
        </div>
      </div>

      <div>
        <label htmlFor="nr-notes" className="block text-sm font-medium text-gray-700">
          Opmerkingen
        </label>
        <textarea
          id="nr-notes"
          name="notes"
          rows={2}
          defaultValue={existingReport?.notes ?? ""}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500"
        />
      </div>

      {/* Photo upload */}
      <div>
        <p className="block text-sm font-medium text-gray-700">Bewijsfoto&apos;s</p>
        <div className="mt-2 space-y-3">
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-emerald-500">
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT_STRING}
              className="hidden"
              onChange={(e) => handlePhotoUpload(e.target.files)}
            />
            {uploading ? (
              <p className="text-sm text-gray-600">Bezig met uploaden...</p>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Klik om foto&apos;s te selecteren
              </button>
            )}
          </div>

          {uploadError && (
            <p className="text-sm text-red-600">{uploadError}</p>
          )}

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((url) => (
                <div key={url} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="Bewijsfoto"
                    className="h-24 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Foto verwijderen"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#1b4332] px-6 py-2 text-sm font-medium text-white hover:bg-[#2d6a4f] disabled:opacity-50"
        >
          {isPending
            ? "Bezig met opslaan..."
            : isEdit
              ? "Rapport bijwerken"
              : "Rapport opslaan"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuleren
          </button>
        )}
      </div>
    </form>
  );
}
