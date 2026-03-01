"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Props {
  campaignId: number;
  currentPhotoUrl: string | null;
}

export default function CampaignPhotoUpload({ campaignId, currentPhotoUrl }: Props) {
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("campaignId", String(campaignId));

    try {
      const res = await fetch("/api/zwerfkatten/upload-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload mislukt");
      } else {
        setPhotoUrl(data.data.photoUrl);
        router.refresh();
      }
    } catch {
      setError("Upload mislukt. Probeer opnieuw.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      {photoUrl ? (
        <div className="relative">
          <Image
            src={photoUrl}
            alt="Foto zwerfkat"
            width={400}
            height={300}
            className="rounded-lg border border-gray-200 object-cover"
          />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
          <p className="text-sm text-gray-400">Geen foto geüpload</p>
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          className="hidden"
          id="campaign-photo-input"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {isUploading ? "Bezig met uploaden..." : photoUrl ? "Foto vervangen" : "Foto uploaden"}
        </button>
        <p className="mt-1 text-xs text-gray-400">JPEG, PNG of WebP — max 10MB</p>
      </div>
    </div>
  );
}
