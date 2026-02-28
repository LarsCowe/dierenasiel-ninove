"use client";

import { useActionState, useState } from "react";
import { submitWalkerRegistration } from "@/lib/actions/walkers";
import type { ActionResult } from "@/types";
import type { Walker } from "@/types";

const initialState: ActionResult<Walker> = { success: false };

const inputClass =
  "w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-body text-sm text-text bg-bg focus:outline-none focus:border-primary transition-colors";

export default function WalkerRegistrationForm() {
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

  if (state.success) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="font-heading text-xl font-bold text-primary-dark mb-2">
          Registratie ontvangen!
        </h3>
        <p className="text-text-light">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      {state.error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      <input type="hidden" name="photoUrl" value={photoUrl} />

      {/* Voornaam + Achternaam */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-semibold mb-1.5">
            Voornaam *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            required
            placeholder="Je voornaam"
            className={inputClass}
          />
          {fieldErrors?.firstName && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-semibold mb-1.5">
            Achternaam *
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            required
            placeholder="Je achternaam"
            className={inputClass}
          />
          {fieldErrors?.lastName && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName[0]}</p>
          )}
        </div>
      </div>

      {/* Geboortedatum + GSM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-semibold mb-1.5">
            Geboortedatum *
          </label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            required
            className={inputClass}
          />
          {fieldErrors?.dateOfBirth && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.dateOfBirth[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold mb-1.5">
            GSM-nummer *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            required
            placeholder="0471 23 45 67"
            className={inputClass}
          />
          {fieldErrors?.phone && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.phone[0]}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-semibold mb-1.5">
          E-mail *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="je@email.com"
          className={inputClass}
        />
        {fieldErrors?.email && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.email[0]}</p>
        )}
      </div>

      {/* Adres */}
      <div className="mb-4">
        <label htmlFor="address" className="block text-sm font-semibold mb-1.5">
          Adres *
        </label>
        <input
          type="text"
          id="address"
          name="address"
          required
          placeholder="Straat, huisnummer, postcode, gemeente"
          className={inputClass}
        />
        {fieldErrors?.address && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.address[0]}</p>
        )}
      </div>

      {/* Allergieën */}
      <div className="mb-4">
        <label htmlFor="allergies" className="block text-sm font-semibold mb-1.5">
          Allergieën
        </label>
        <textarea
          id="allergies"
          name="allergies"
          rows={2}
          placeholder="Vermeld eventuele allergieën (optioneel)"
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Kinderen checkbox */}
      <div className="mb-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="childrenWalkAlong"
            value="true"
            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm">
            Mijn kinderen zullen mee wandelen (onder mijn begeleiding)
          </span>
        </label>
      </div>

      {/* Foto upload */}
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1.5">
          Foto (optioneel)
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoUpload}
          className="block w-full text-sm text-text-light file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
        {uploading && (
          <p className="text-primary text-xs mt-1">Foto uploaden...</p>
        )}
        {uploadError && (
          <p className="text-red-500 text-xs mt-1">{uploadError}</p>
        )}
        {photoPreview && (
          <img
            src={photoPreview}
            alt="Preview"
            className="mt-2 w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
          />
        )}
      </div>

      {/* Reglement checkbox */}
      <div className="mb-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="regulationsRead"
            value="true"
            required
            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary mt-0.5"
          />
          <span className="text-sm">
            Ik heb het{" "}
            <a
              href="/wandelreglement"
              target="_blank"
              className="text-primary font-semibold hover:text-accent transition-colors underline"
            >
              wandelreglement
            </a>{" "}
            gelezen en ga hiermee akkoord *
          </span>
        </label>
        {fieldErrors?.regulationsRead && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.regulationsRead[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending || uploading}
        className="w-full py-4 bg-accent text-white rounded-full font-bold text-center shadow-lg shadow-accent/40 hover:bg-accent/90 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Registratie versturen..." : "Registreer als wandelaar →"}
      </button>
    </form>
  );
}
