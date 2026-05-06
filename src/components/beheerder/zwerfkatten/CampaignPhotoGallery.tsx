"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { CampaignPhoto } from "@/lib/queries/stray-cat-campaigns";

interface Props {
  campaignId: number;
  photos: CampaignPhoto[];
}

export default function CampaignPhotoGallery({ campaignId, photos }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<CampaignPhoto | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeleting, startDelete] = useTransition();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);
    setProgress({ done: 0, total: files.length });

    let firstError: string | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("campaignId", String(campaignId));

      try {
        const res = await fetch("/api/zwerfkatten/photos", {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          firstError = firstError ?? data.error ?? `Upload mislukt voor ${file.name}`;
        }
      } catch {
        firstError = firstError ?? `Upload mislukt voor ${file.name}`;
      }
      setProgress({ done: i + 1, total: files.length });
    }

    setIsUploading(false);
    setProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (firstError) {
      setError(firstError);
    }
    router.refresh();
  }

  function handleDelete(photoId: number) {
    setError(null);
    startDelete(async () => {
      try {
        const res = await fetch(`/api/zwerfkatten/photos/${photoId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Verwijderen mislukt");
        } else {
          setConfirmDeleteId(null);
          router.refresh();
        }
      } catch {
        setError("Verwijderen mislukt. Probeer opnieuw.");
      }
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      {photos.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
          <p className="text-sm text-gray-400">Nog geen foto&apos;s geüpload.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
            >
              <button
                type="button"
                onClick={() => setPreviewPhoto(photo)}
                className="block w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label={`Bekijk foto ${photo.fileName}`}
              >
                <Image
                  src={photo.blobUrl}
                  alt={photo.fileName}
                  width={300}
                  height={200}
                  className="h-28 w-full object-cover"
                  unoptimized
                />
              </button>
              {confirmDeleteId === photo.id ? (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-red-600/90 px-2 py-1 text-xs text-white">
                  <span>Verwijderen?</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(photo.id)}
                      disabled={isDeleting}
                      className="rounded bg-white px-2 py-0.5 font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {isDeleting ? "..." : "Ja"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded bg-white/20 px-2 py-0.5 font-medium text-white hover:bg-white/30"
                    >
                      Nee
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(photo.id)}
                  aria-label={`Verwijder ${photo.fileName}`}
                  title="Verwijderen"
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-gray-500 opacity-0 shadow transition-opacity hover:bg-white hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleUpload}
          className="hidden"
          id="campaign-photos-input"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {isUploading
            ? progress
              ? `Bezig... (${progress.done}/${progress.total})`
              : "Bezig met uploaden..."
            : photos.length > 0
              ? "Foto's toevoegen"
              : "Foto's uploaden"}
        </button>
        <p className="mt-1 text-xs text-gray-400">JPEG, PNG of WebP — max 10MB per foto. Meerdere tegelijk mogelijk.</p>
      </div>

      {previewPhoto && (
        <PhotoPreviewModal photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />
      )}
    </div>
  );
}

function PhotoPreviewModal({
  photo,
  onClose,
}: {
  photo: CampaignPhoto;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={photo.fileName}
    >
      <div
        className="relative max-h-[90vh] max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={photo.blobUrl}
          alt={photo.fileName}
          width={1200}
          height={900}
          unoptimized
          className="max-h-[85vh] w-auto rounded-lg object-contain shadow-2xl"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Sluiten"
          className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-gray-700 shadow hover:bg-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
