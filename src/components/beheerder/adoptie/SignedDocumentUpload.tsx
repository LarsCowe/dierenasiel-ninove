"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  contractId: number;
  hasExisting: boolean;
}

export default function SignedDocumentUpload({ contractId, hasExisting }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/adoptie-contract/${contractId}/signed-upload`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Upload mislukt");
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("upload failed:", err);
      setError("Upload mislukt — netwerkfout");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-3">
      <label className="inline-flex cursor-pointer items-center rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100">
        {isUploading ? "Bezig met uploaden..." : hasExisting ? "Vervangen" : "Getekende versie opladen"}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
          onChange={handleChange}
          disabled={isUploading}
          className="hidden"
        />
      </label>
      <p className="mt-1 text-[11px] text-gray-500">PDF, PNG, JPG of WebP — max 10MB</p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
