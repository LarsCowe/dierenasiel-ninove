import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockInsertReturning, mockInsertValues, mockInsert,
  mockUpdateSet, mockUpdate,
  mockRequirePermission, mockLogAudit, mockRevalidate, mockGetSession,
  mockGetAnimalById, mockGetLastNr, mockGetForm,
  mockSendEmail, mockBuildAttachment,
} = vi.hoisted(() => {
  const mockInsertReturning = vi.fn();
  const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
  const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
  const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
  const mockUpdateSet = vi.fn().mockReturnValue({ where: mockUpdateWhere });
  const mockUpdate = vi.fn().mockReturnValue({ set: mockUpdateSet });
  return {
    mockInsertReturning, mockInsertValues, mockInsert,
    mockUpdateSet, mockUpdate,
    mockRequirePermission: vi.fn(), mockLogAudit: vi.fn(), mockRevalidate: vi.fn(), mockGetSession: vi.fn(),
    mockGetAnimalById: vi.fn(), mockGetLastNr: vi.fn(), mockGetForm: vi.fn(),
    mockSendEmail: vi.fn(), mockBuildAttachment: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({ db: { insert: mockInsert, update: mockUpdate } }));
vi.mock("@/lib/db/schema", () => ({ ownerReturnForms: { id: "owner_return_forms.id" } }));
vi.mock("@/lib/permissions", () => ({ requirePermission: mockRequirePermission }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidate }));
vi.mock("@/lib/queries/animals", () => ({ getAnimalById: mockGetAnimalById }));
vi.mock("@/lib/queries/owner-return", () => ({
  getLastOwnerReturnNr: mockGetLastNr,
  getOwnerReturnForm: mockGetForm,
}));
vi.mock("@/lib/email/send", () => ({ sendEmail: mockSendEmail }));
vi.mock("@/lib/animals/owner-return-document", () => ({ buildOwnerReturnAttachment: mockBuildAttachment }));

import { createOwnerReturnForm, emailOwnerReturnCopy } from "./owner-return";

function fd(data: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) f.append(k, v);
  return f;
}

const geldig = {
  animalId: "7",
  drawnUpOn: "2026-09-12",
  drawnUpAt: "Denderwindeke",
  ownerLastName: "Peeters",
  ownerFirstName: "An",
  ownerStreet: "Kerkstraat 1",
  ownerPostalCode: "9400",
  ownerCity: "Ninove",
  ownerCountry: "",
  ownerBirthDate: "",
  ownerBirthPlace: "",
  ownerPhone: "",
  ownerMobile: "0470 00 00 00",
  ownerEmail: "an@example.com",
  animalName: "Bo",
  animalSpecies: "hond",
  animalBreed: "Chow Chow",
  animalBirthDate: "2024-10-27",
  animalIdentificationNr: "981",
  animalGender: "M",
  animalNeutered: "ja",
  animalPedigree: "",
  animalPassportNr: "",
  animalCoatDescription: "Ros",
  stayCosts: "3 x 15",
  totalPaid: "45,00",
};

const formulier = {
  id: 12,
  formNr: "TNE-2026-0003",
  animalId: 7,
  drawnUpOn: "2026-09-12",
  ownerLastName: "Peeters",
  ownerFirstName: "An",
  ownerEmail: "an@example.com",
  animalName: "Bo",
  signedDocumentUrl: null,
  copyEmailedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRequirePermission.mockResolvedValue(undefined);
  mockLogAudit.mockResolvedValue(undefined);
  mockGetSession.mockResolvedValue({ userId: 20, role: "beheerder" });
  mockGetAnimalById.mockResolvedValue({ id: 7, name: "Bo", isInShelter: true });
  mockGetLastNr.mockReset();
  mockGetLastNr.mockResolvedValue("TNE-2026-0002");
  mockInsertReturning.mockReset();
  mockInsertReturning.mockResolvedValue([{ ...formulier }]);
  mockGetForm.mockReset();
  mockGetForm.mockResolvedValue({ ...formulier });
  mockSendEmail.mockReset();
  mockSendEmail.mockResolvedValue({ success: true, id: "msg_1" });
  mockBuildAttachment.mockReset();
  mockBuildAttachment.mockResolvedValue({ filename: "terug-naar-eigenaar-TNE-2026-0003.pdf", content: Buffer.from("%PDF"), signed: false });
});

describe("createOwnerReturnForm (Story 10.64)", () => {
  it("weigert zonder animal:write", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const r = await createOwnerReturnForm(null, fd(geldig));
    expect(r.success).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("bewaart het formulier met het volgende volgnummer, het bedrag met een punt en wie het opmaakte", async () => {
    const r = await createOwnerReturnForm(null, fd(geldig));
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.id).toBe(12);

    const rij = mockInsertValues.mock.calls[0][0];
    expect(rij.formNr).toBe("TNE-2026-0003");
    expect(rij.animalId).toBe(7);
    expect(rij.totalPaid).toBe("45.00");
    expect(rij.ownerBirthDate).toBeNull();
    expect(rij.animalGender).toBe("M");
    expect(rij.createdBy).toBe(20);
    expect(mockLogAudit).toHaveBeenCalledWith("create_owner_return_form", "owner_return_form", 12, null, expect.anything());
    expect(mockRevalidate).toHaveBeenCalledWith("/beheerder/dieren/7");
  });

  it("stuurt de ingevulde waarden terug bij een validatiefout (React 19 wist het formulier)", async () => {
    const r = await createOwnerReturnForm(null, fd({ ...geldig, ownerLastName: "", totalPaid: "veel" }));
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.fieldErrors?.ownerLastName?.[0]).toBe("Familienaam is verplicht");
    expect(r.fieldErrors?.totalPaid?.[0]).toBe("Geen geldig bedrag");
    expect(r.values?.ownerFirstName).toBe("An");
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("weigert een dier dat niet bestaat", async () => {
    mockGetAnimalById.mockResolvedValue(null);
    const r = await createOwnerReturnForm(null, fd(geldig));
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error).toBe("Dier niet gevonden");
  });

  it("probeert één keer opnieuw met een volgend nummer als twee collega's tegelijk opslaan", async () => {
    const dubbel = Object.assign(new Error("dubbel"), { cause: { code: "23505" } });
    mockInsertReturning.mockRejectedValueOnce(dubbel).mockResolvedValueOnce([{ ...formulier, formNr: "TNE-2026-0004" }]);
    mockGetLastNr.mockResolvedValueOnce("TNE-2026-0002").mockResolvedValueOnce("TNE-2026-0003");

    const r = await createOwnerReturnForm(null, fd(geldig));
    expect(r.success).toBe(true);
    expect(mockInsertValues.mock.calls[1][0].formNr).toBe("TNE-2026-0004");
  });

  it("geeft een algemene fout mét de waarden terug als de databank faalt", async () => {
    mockInsertReturning.mockRejectedValue(new Error("kapot"));
    const r = await createOwnerReturnForm(null, fd(geldig));
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error).toContain("opslaan");
    expect(r.values?.ownerLastName).toBe("Peeters");
  });
});

describe("emailOwnerReturnCopy (Story 10.64)", () => {
  it("weigert zonder animal:write", async () => {
    mockRequirePermission.mockResolvedValue({ success: false, error: "Onvoldoende rechten" });
    const r = await emailOwnerReturnCopy(7, 12);
    expect(r.success).toBe(false);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("weigert als het formulier niet bij dat dier hoort", async () => {
    mockGetForm.mockResolvedValue(null);
    const r = await emailOwnerReturnCopy(7, 12);
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error).toBe("Formulier niet gevonden");
  });

  it("weigert zonder e-mailadres van de eigenaar", async () => {
    mockGetForm.mockResolvedValue({ ...formulier, ownerEmail: "" });
    const r = await emailOwnerReturnCopy(7, 12);
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error).toContain("e-mailadres");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("mailt het formulier als bijlage naar de eigenaar en bewaart wanneer en naar wie", async () => {
    const r = await emailOwnerReturnCopy(7, 12);
    expect(r.success).toBe(true);

    expect(mockBuildAttachment).toHaveBeenCalledWith(expect.objectContaining({ id: 12 }));
    const mail = mockSendEmail.mock.calls[0][0];
    expect(mail.to).toBe("an@example.com");
    expect(mail.subject).toContain("TNE-2026-0003");
    expect(mail.attachments).toEqual([{ filename: "terug-naar-eigenaar-TNE-2026-0003.pdf", content: Buffer.from("%PDF") }]);

    expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ copyEmailedTo: "an@example.com", copyEmailedAt: expect.any(Date) }));
    expect(mockLogAudit).toHaveBeenCalledWith("owner_return_form.copy_emailed", "owner_return_form", 12, null, expect.objectContaining({ to: "an@example.com" }));
  });

  it("zegt dat de getekende versie meeging wanneer die er is", async () => {
    mockBuildAttachment.mockResolvedValue({ filename: "getekend.pdf", content: Buffer.from("x"), signed: true });
    const r = await emailOwnerReturnCopy(7, 12);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.message).toContain("getekende");
    expect(mockSendEmail.mock.calls[0][0].html).toContain("getekende");
  });

  it("geeft een nette fout zonder Resend-details als de mail niet vertrekt", async () => {
    mockSendEmail.mockResolvedValue({ success: false, error: "Domain not verified for an@example.com" });
    const r = await emailOwnerReturnCopy(7, 12);
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error).toBe("De mail kon niet verstuurd worden. Probeer later opnieuw of druk het formulier af.");
    expect(mockUpdateSet).not.toHaveBeenCalled();
  });

  it("geeft een nette fout als de bijlage niet opgebouwd raakt", async () => {
    mockBuildAttachment.mockRejectedValue(new Error("blob weg"));
    const r = await emailOwnerReturnCopy(7, 12);
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(r.error).toContain("bijlage");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
