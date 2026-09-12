import { describe, it, expect } from "vitest";
import { ownerReturnFormSchema } from "./owner-return";

/** Story 10.64 — validatie van het formulier "Terug naar eigenaar". */

const geldig = {
  drawnUpOn: "2026-09-12",
  drawnUpAt: "Denderwindeke",
  ownerLastName: "Peeters",
  ownerFirstName: "An",
  ownerStreet: "Kerkstraat 1",
  ownerPostalCode: "9400",
  ownerCity: "Ninove",
  ownerCountry: "",
  ownerBirthDate: "1980-02-03",
  ownerBirthPlace: "Aalst",
  ownerPhone: "",
  ownerMobile: "0470 00 00 00",
  ownerEmail: "an@example.com",
  animalName: "Bo",
  animalSpecies: "hond",
  animalBreed: "",
  animalBirthDate: "",
  animalIdentificationNr: "",
  animalGender: "M",
  animalNeutered: "ja",
  animalPedigree: "",
  animalPassportNr: "",
  animalCoatDescription: "",
  stayCosts: "",
  totalPaid: "45",
};

describe("ownerReturnFormSchema", () => {
  it("aanvaardt een volledig formulier", () => {
    const r = ownerReturnFormSchema.safeParse(geldig);
    expect(r.success).toBe(true);
  });

  it("eist familienaam, voornaam, datum van opmaak en naam van het dier", () => {
    const r = ownerReturnFormSchema.safeParse({
      ...geldig,
      ownerLastName: " ",
      ownerFirstName: "",
      drawnUpOn: "",
      animalName: "",
    });
    expect(r.success).toBe(false);
    if (r.success) return;
    const fouten = r.error.flatten().fieldErrors;
    expect(fouten.ownerLastName?.[0]).toBe("Familienaam is verplicht");
    expect(fouten.ownerFirstName?.[0]).toBe("Voornaam is verplicht");
    expect(fouten.drawnUpOn?.[0]).toBe("Datum van opmaak is verplicht");
    expect(fouten.animalName?.[0]).toBe("Naam van het dier is verplicht");
  });

  it("weigert een datum die geen JJJJ-MM-DD is", () => {
    const r = ownerReturnFormSchema.safeParse({ ...geldig, drawnUpOn: "12/09/2026", ownerBirthDate: "1980" });
    expect(r.success).toBe(false);
    if (r.success) return;
    const fouten = r.error.flatten().fieldErrors;
    expect(fouten.drawnUpOn?.[0]).toContain("JJJJ-MM-DD");
    expect(fouten.ownerBirthDate?.[0]).toContain("JJJJ-MM-DD");
  });

  it("weigert een dag die niet bestaat (review 10.64)", () => {
    const r = ownerReturnFormSchema.safeParse({ ...geldig, drawnUpOn: "2026-02-31", ownerBirthDate: "1980-99-99" });
    expect(r.success).toBe(false);
    if (r.success) return;
    const fouten = r.error.flatten().fieldErrors;
    expect(fouten.drawnUpOn?.[0]).toBe("Deze datum bestaat niet");
    expect(fouten.ownerBirthDate?.[0]).toBe("Deze datum bestaat niet");
  });

  it("weigert een bedrag dat niet in de kolom past (review 10.64)", () => {
    const r = ownerReturnFormSchema.safeParse({ ...geldig, totalPaid: "111111111111111111111,50" });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.flatten().fieldErrors.totalPaid?.[0]).toBe("Maximaal 20 tekens");
  });

  it("laat een lege geboortedatum toe", () => {
    const r = ownerReturnFormSchema.safeParse({ ...geldig, ownerBirthDate: "", animalBirthDate: "" });
    expect(r.success).toBe(true);
  });

  it("controleert het e-mailadres enkel als er een is ingevuld", () => {
    expect(ownerReturnFormSchema.safeParse({ ...geldig, ownerEmail: "" }).success).toBe(true);
    const r = ownerReturnFormSchema.safeParse({ ...geldig, ownerEmail: "geen adres" });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.flatten().fieldErrors.ownerEmail?.[0]).toBe("Geen geldig e-mailadres");
  });

  it("beperkt geslacht, gesteriliseerd en stamboom tot de vakjes op het formulier", () => {
    expect(ownerReturnFormSchema.safeParse({ ...geldig, animalGender: "X" }).success).toBe(false);
    expect(ownerReturnFormSchema.safeParse({ ...geldig, animalNeutered: "misschien" }).success).toBe(false);
    expect(ownerReturnFormSchema.safeParse({ ...geldig, animalPedigree: "nee" }).success).toBe(true);
    expect(ownerReturnFormSchema.safeParse({ ...geldig, animalGender: "", animalNeutered: "", animalPedigree: "" }).success).toBe(true);
  });

  it("aanvaardt een bedrag met komma en zet het om naar een punt", () => {
    const r = ownerReturnFormSchema.safeParse({ ...geldig, totalPaid: "12,50" });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.totalPaid).toBe("12.50");
  });

  it("weigert een bedrag dat geen getal is", () => {
    const r = ownerReturnFormSchema.safeParse({ ...geldig, totalPaid: "veel" });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error.flatten().fieldErrors.totalPaid?.[0]).toBe("Geen geldig bedrag");
  });

  it("knipt spaties weg en bewaart lege velden als lege tekst", () => {
    const r = ownerReturnFormSchema.safeParse({ ...geldig, ownerCity: "  Ninove  ", animalBreed: "   " });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.ownerCity).toBe("Ninove");
    expect(r.data.animalBreed).toBe("");
  });
});
