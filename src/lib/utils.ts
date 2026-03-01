import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SPECIES_LABELS, GENDER_LABELS, STATUS_LABELS } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function calculateAge(dateOfBirth: Date | string | null): string {
  if (!dateOfBirth) return "Onbekend";
  const dob =
    typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  const now = new Date();
  const years = now.getFullYear() - dob.getFullYear();
  const months = now.getMonth() - dob.getMonth();
  const totalMonths = years * 12 + months;

  if (totalMonths < 12) {
    return `${totalMonths} maanden`;
  }
  const y = Math.floor(totalMonths / 12);
  return `${y} jaar`;
}

export function speciesLabel(species: string): string {
  return SPECIES_LABELS[species] || species;
}

export function genderLabel(gender: string): string {
  return GENDER_LABELS[gender] || gender;
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

export function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
