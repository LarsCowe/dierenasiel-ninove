"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/validations/attachments";

const ACCEPT_STRING = ALLOWED_MIME_TYPES.join(",");

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 200);
}

interface FileUploadProps {
  animalId: number;
  context?: string;
  onUploadComplete?: () => void;
}

export default function FileUpload({ animalId, context = "dossier", onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    setErrors([]);
    setUploading(true);

    const newErrors: string[] = [];
    let hasSuccess = false;

    try {
      for (const file of Array.from(files)) {
        if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
          newErrors.push(`"${file.name}" heeft een ongeldig bestandstype.`);
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          newErrors.push(`"${file.name}" is te groot (max 50MB).`);
          continue;
        }

        try {
          const timestamp = Date.now();
          const safeName = sanitizeFileName(file.name);
          const pathname = `animals/${animalId}/${timestamp}-${safeName}`;

          // Upload directly from browser to Vercel Blob (bypasses serverless body limit)
          const blob = await upload(pathname, file, {
            access: "public",
            handleUploadUrl: "/api/upload/client",
            clientPayload: JSON.stringify({ animalId, context }),
          });

          // Record the upload in the database
          const recordRes = await fetch("/api/upload/record", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              blobUrl: blob.url,
              fileName: file.name,
              fileType: file.type,
              animalId,
              context,
            }),
          });

          if (!recordRes.ok) {
            const body = await recordRes.json();
            newErrors.push(`"${file.name}": ${body.error || "Opslaan mislukt"}`);
            continue;
          }

          hasSuccess = true;
        } catch {
          newErrors.push(`"${file.name}": Upload mislukt. Probeer opnieuw.`);
        }
      }

      if (newErrors.length) setErrors(newErrors);

      if (hasSuccess) {
        router.refresh();
        onUploadComplete?.();
      }
    } catch {
      setErrors(["Er ging iets mis bij het uploaden."]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-emerald-500 bg-emerald-50"
            : "border-gray-300 hover:border-emerald-500"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_STRING}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploading ? (
          <p className="text-sm text-gray-600">Bezig met uploaden...</p>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Sleep bestanden hierheen of{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-medium text-emerald-600 hover:text-emerald-700"
              >
                klik om te selecteren
              </button>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Afbeeldingen, video&apos;s en PDF — max 50MB per bestand
            </p>
          </>
        )}
      </div>

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-600">{err}</p>
          ))}
        </div>
      )}
    </div>
  );
}
