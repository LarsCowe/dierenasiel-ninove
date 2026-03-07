"use client";

import { useState, useRef } from "react";
import { upload } from "@vercel/blob/client";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const ACCEPT_STRING = ALLOWED_TYPES.join(",");

interface UploadedFile {
  url: string;
  name: string;
}

interface Props {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
}

export default function AdoptionPhotoUpload({ files, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) {
      setErrors([`Maximaal ${MAX_FILES} bestanden toegestaan.`]);
      return;
    }

    setErrors([]);
    setUploading(true);

    const newErrors: string[] = [];
    const newFiles: UploadedFile[] = [];

    const toUpload = Array.from(fileList).slice(0, remaining);

    for (const file of toUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        newErrors.push(`"${file.name}" heeft een ongeldig type. Enkel afbeeldingen en video.`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        newErrors.push(`"${file.name}" is te groot (max 10MB).`);
        continue;
      }

      try {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
        const pathname = `adoption-requests/${timestamp}-${safeName}`;

        const blob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/upload/public-adoption",
        });

        newFiles.push({ url: blob.url, name: file.name });
      } catch {
        newErrors.push(`"${file.name}": Upload mislukt. Probeer opnieuw.`);
      }
    }

    if (newErrors.length) setErrors(newErrors);
    if (newFiles.length) onChange([...files, ...newFiles]);

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {files.map((f, i) => (
            <div key={f.url} className="group relative overflow-hidden rounded-lg border border-gray-200">
              {f.name.match(/\.(mp4|mov|webm)$/i) ? (
                <video src={f.url} className="h-28 w-full object-cover" />
              ) : (
                <img src={f.url} alt={f.name} className="h-28 w-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
                title="Verwijderen"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <p className="truncate px-1.5 py-1 text-xs text-gray-500">{f.name}</p>
            </div>
          ))}
        </div>
      )}

      {files.length < MAX_FILES && (
        <div
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragOver ? "border-[#52796f] bg-emerald-50" : "border-gray-300 hover:border-[#52796f]"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
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
                  className="font-medium text-[#52796f] hover:text-[#2d6a4f]"
                >
                  klik om te selecteren
                </button>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Afbeeldingen of video &mdash; max {MAX_FILES} bestanden, max 10MB per bestand
              </p>
            </>
          )}
        </div>
      )}

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
