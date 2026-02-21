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
  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
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
  const labels: Record<string, string> = {
    hond: "Hond",
    kat: "Kat",
    konijn: "Konijn",
    cavia: "Cavia",
    ezel: "Ezel",
    kip: "Kip",
    hangbuikvarken: "Hangbuikvarken",
  };
  return labels[species] || species;
}

export function genderLabel(gender: string): string {
  const labels: Record<string, string> = {
    reu: "Reu",
    teef: "Teef",
    mannetje: "Mannetje",
    vrouwtje: "Vrouwtje",
    kater: "Kater",
    poes: "Poes",
  };
  return labels[gender] || gender;
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    beschikbaar: "Beschikbaar",
    gereserveerd: "Gereserveerd",
    geadopteerd: "Geadopteerd",
    in_behandeling: "In behandeling",
  };
  return labels[status] || status;
}
