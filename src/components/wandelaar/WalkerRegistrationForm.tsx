"use client";

import { useActionState, useState } from "react";
import { submitWalkerRegistration } from "@/lib/actions/walkers";
import type { ActionResult } from "@/types";
import type { Walker } from "@/types";

const initialState: ActionResult<Walker> = { success: false };

interface Props {
  variant?: "light" | "dark";
}

const INPUT_LIGHT =
  "w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-body text-sm text-text bg-bg focus:outline-none focus:border-primary transition-colors";
const INPUT_DARK =
  "w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 font-body text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all";

export default function WalkerRegistrationForm({ variant = "light" }: Props) {
  const dark = variant === "dark";
  const inputClass = dark ? INPUT_DARK : INPUT_LIGHT;
  const [state, formAction, pending] = useActionState(submitWalkerRegistration, initialState);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fieldErrors = !state.success && "fieldErrors" in state ? state.fieldErrors : undefined;

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);

    // Preview
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/wandelaar/upload-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setPhotoUrl(data.url);
      } else {
        setUploadError(data.error || "Foto uploaden mislukt");
        setPhotoPreview(null);
      }
    } catch {
      setUploadError("Foto uploaden mislukt. Probeer opnieuw.");
      setPhotoPreview(null);
    } finally {
      setUploading(false);
    }
  }

  const labelClass = dark
    ? "block text-sm font-semibold text-white/80 mb-1.5"
    : "block text-sm font-semibold mb-1.5";
  const checkboxClass = dark
    ? "w-5 h-5 rounded border-white/30 bg-white/10 text-accent focus:ring-accent"
    : "w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary";
  const textClass = dark ? "text-sm text-white/80" : "text-sm";
  const errorClass = dark ? "text-red-300 text-xs mt-1" : "text-red-500 text-xs mt-1";
  const fileClass = dark
    ? "block w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white/80 hover:file:bg-white/20"
    : "block w-full text-sm text-text-light file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20";

  if (state.success) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">✅</div>
        <h3 className={`font-heading text-xl font-bold mb-2 ${dark ? "text-white" : "text-primary-dark"}`}>
          Registratie ontvangen!
        </h3>
        <p className={dark ? "text-white/70" : "text-text-light"}>
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className={`p-3 rounded-lg text-sm ${dark ? "bg-red-500/20 border border-red-400/30 text-red-200" : "bg-red-50 text-red-700"}`}>
          {state.error}
        </div>
      )}

      <input type="hidden" name="photoUrl" value={photoUrl} />

      {/* Voornaam + Achternaam */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className={labelClass}>Voornaam *</label>
          <input type="text" id="firstName" name="firstName" required placeholder="Je voornaam" className={inputClass} />
          {fieldErrors?.firstName && <p className={errorClass}>{fieldErrors.firstName[0]}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>Achternaam *</label>
          <input type="text" id="lastName" name="lastName" required placeholder="Je achternaam" className={inputClass} />
          {fieldErrors?.lastName && <p className={errorClass}>{fieldErrors.lastName[0]}</p>}
        </div>
      </div>

      {/* Geboortedatum + GSM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dateOfBirth" className={labelClass}>Geboortedatum *</label>
          <input type="date" id="dateOfBirth" name="dateOfBirth" required className={inputClass} />
          {fieldErrors?.dateOfBirth && <p className={errorClass}>{fieldErrors.dateOfBirth[0]}</p>}
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>GSM-nummer *</label>
          <input type="tel" id="phone" name="phone" required placeholder="0471 23 45 67" className={inputClass} />
          {fieldErrors?.phone && <p className={errorClass}>{fieldErrors.phone[0]}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={labelClass}>E-mail *</label>
        <input type="email" id="email" name="email" required placeholder="je@email.com" className={inputClass} />
        {fieldErrors?.email && <p className={errorClass}>{fieldErrors.email[0]}</p>}
      </div>

      {/* Adres */}
      <div>
        <label htmlFor="address" className={labelClass}>Adres *</label>
        <input type="text" id="address" name="address" required placeholder="Straat, huisnummer, postcode, gemeente" className={inputClass} />
        {fieldErrors?.address && <p className={errorClass}>{fieldErrors.address[0]}</p>}
      </div>

      {/* Allergieën */}
      <div>
        <label htmlFor="allergies" className={labelClass}>Allergieën</label>
        <textarea id="allergies" name="allergies" rows={2} placeholder="Vermeld eventuele allergieën (optioneel)" className={`${inputClass} resize-y`} />
      </div>

      {/* Kinderen checkbox */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" name="childrenWalkAlong" value="true" className={checkboxClass} />
          <span className={textClass}>Mijn kinderen zullen mee wandelen (onder mijn begeleiding)</span>
        </label>
      </div>

      {/* Foto upload */}
      <div>
        <label className={labelClass}>Foto (optioneel)</label>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className={fileClass} />
        {uploading && <p className={`text-xs mt-1 ${dark ? "text-white/60" : "text-primary"}`}>Foto uploaden...</p>}
        {uploadError && <p className={errorClass}>{uploadError}</p>}
        {photoPreview && (
          <img src={photoPreview} alt="Preview" className={`mt-2 w-24 h-24 object-cover rounded-lg border-2 ${dark ? "border-white/20" : "border-gray-200"}`} />
        )}
      </div>

      {/* Reglement checkbox */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" name="regulationsRead" value="true" required className={`${checkboxClass} mt-0.5`} />
          <span className={textClass}>
            Ik heb het{" "}
            <a href="/wandelreglement" target="_blank" className={`font-semibold underline ${dark ? "text-white hover:text-white/80" : "text-primary hover:text-accent"} transition-colors`}>
              wandelreglement
            </a>{" "}
            gelezen en ga hiermee akkoord *
          </span>
        </label>
        {fieldErrors?.regulationsRead && <p className={errorClass}>{fieldErrors.regulationsRead[0]}</p>}
      </div>

      <button
        type="submit"
        disabled={pending || uploading}
        className={`w-full py-3.5 text-white font-bold text-center transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed ${
          dark
            ? "bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/25"
            : "bg-accent hover:bg-accent/90 rounded-full shadow-lg shadow-accent/40 py-4"
        }`}
      >
        {pending ? "Registratie versturen..." : "Registreer als wandelaar"}
      </button>
    </form>
  );
}
