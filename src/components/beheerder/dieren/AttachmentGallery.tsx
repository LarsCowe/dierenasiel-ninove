"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAttachment, setMainPhoto } from "@/lib/actions/attachments";
import type { AnimalAttachment } from "@/types";

interface AttachmentGalleryProps {
  attachments: AnimalAttachment[];
  currentMainPhoto: string | null;
}

export default function AttachmentGallery({
  attachments,
  currentMainPhoto,
}: AttachmentGalleryProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingMainId, setSettingMainId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Weet je zeker dat je deze bijlage wilt verwijderen?")) return;

    setDeletingId(id);
    const result = await deleteAttachment(id);
    setDeletingId(null);

    if (!result.success) {
      alert(result.error || "Verwijderen mislukt");
      return;
    }

    router.refresh();
  }

  async function handleSetMain(id: number) {
    setSettingMainId(id);
    const result = await setMainPhoto(id);
    setSettingMainId(null);

    if (!result.success) {
      alert(result.error || "Instellen als hoofdfoto mislukt");
      return;
    }

    router.refresh();
  }

  if (!attachments.length) {
    return (
      <p className="text-sm text-gray-500">Nog geen bijlagen geüpload.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {attachments.map((att) => {
        const isImage = att.fileType.startsWith("image/");
        const isVideo = att.fileType.startsWith("video/");
        const isMainPhoto = att.fileUrl === currentMainPhoto;

        return (
          <div
            key={att.id}
            className="group relative rounded-lg border border-gray-200 bg-white p-2 shadow-sm"
          >
            {/* Main photo badge */}
            {isMainPhoto && (
              <span className="absolute left-2 top-2 z-10 rounded bg-emerald-600 px-2 py-1 text-xs text-white">
                Hoofdfoto
              </span>
            )}

            {/* Preview */}
            <div className="flex h-32 items-center justify-center overflow-hidden rounded bg-gray-50">
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={att.fileUrl}
                  alt={att.fileName}
                  className="h-full w-full object-cover"
                />
              ) : isVideo ? (
                <div className="text-center">
                  <span className="text-3xl">🎬</span>
                  <p className="mt-1 text-xs text-gray-500">Video</p>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-3xl">📄</span>
                  <p className="mt-1 text-xs text-gray-500">PDF</p>
                </div>
              )}
            </div>

            {/* File name */}
            <p className="mt-2 truncate text-xs text-gray-700" title={att.fileName}>
              {att.fileName}
            </p>

            {/* Upload date */}
            <p className="text-xs text-gray-400">
              {new Date(att.uploadedAt).toLocaleDateString("nl-BE")}
            </p>

            {/* Actions */}
            <div className="mt-2 flex items-center gap-2">
              {isImage && !isMainPhoto && (
                <button
                  type="button"
                  onClick={() => handleSetMain(att.id)}
                  disabled={settingMainId === att.id}
                  className="text-xs text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
                >
                  {settingMainId === att.id ? "Bezig..." : "Als hoofdfoto"}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDelete(att.id)}
                disabled={deletingId === att.id}
                className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {deletingId === att.id ? "Bezig..." : "Verwijderen"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
