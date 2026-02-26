"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
];

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

interface FileUploadProps {
  animalId: number;
  onUploadComplete?: () => void;
}

export default function FileUpload({ animalId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    setError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(`"${file.name}" heeft een ongeldig bestandstype. Toegestaan: afbeeldingen, video's en PDF.`);
          continue;
        }

        if (file.size > MAX_SIZE) {
          setError(`"${file.name}" is te groot (max 50MB).`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("animalId", String(animalId));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const body = await response.json();
          setError(body.error || "Upload mislukt");
          continue;
        }
      }

      router.refresh();
      onUploadComplete?.();
    } catch {
      setError("Er ging iets mis bij het uploaden.");
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
          accept="image/*,video/mp4,video/quicktime,video/webm,.pdf"
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

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
