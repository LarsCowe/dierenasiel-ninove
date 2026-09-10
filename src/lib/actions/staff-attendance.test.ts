import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetSession,
  mockHasPermission,
  mockLogAudit,
  mockSelectLimit,
  mockInsertValues,
  mockDeleteWhere,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockHasPermission: vi.fn(),
  mockLogAudit: vi.fn(),
  mockSelectLimit: vi.fn(),
  mockInsertValues: vi.fn(),
  mockDeleteWhere: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({ where: vi.fn(() => ({ limit: mockSelectLimit })) })),
    })),
    insert: vi.fn(() => ({ values: mockInsertValues })),
    delete: vi.fn(() => ({ where: mockDeleteWhere })),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  staffAttendance: { id: "id", date: "date", userId: "userId" },
}));

vi.mock("@/lib/auth/session", () => ({ getSession: mockGetSession }));
vi.mock("@/lib/permissions", () => ({ hasPermission: mockHasPermission }));
vi.mock("@/lib/audit", () => ({ logAudit: mockLogAudit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { addPersonToDay, removeAttendance, signUpForDay } from "./staff-attendance";

const form = (entries: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
};

/** Een bestaande inschrijving op de dag, zoals de actie ze uit de databank leest. */
const rij = (overrides: Record<string, unknown> = {}) => ({
  id: 3,
  userId: 7,
  guestName: null,
  startTime: null,
  endTime: null,
  ...overrides,
});

beforeEach(() => {
  mockGetSession.mockReset().mockResolvedValue({ userId: 7, role: "medewerker", name: "Nathalie" });
  mockHasPermission.mockReset().mockReturnValue(false);
  mockLogAudit.mockReset().mockResolvedValue(undefined);
  mockSelectLimit.mockReset().mockResolvedValue([]);
  mockInsertValues.mockReset().mockResolvedValue(undefined);
  mockDeleteWhere.mockReset().mockResolvedValue(undefined);
});

describe("signUpForDay", () => {
  it("schrijft de ingelogde gebruiker in, zonder schrijfrecht", async () => {
    const result = await signUpForDay(null, form({ date: "2026-08-16", note: "" }));

    expect(result.success).toBe(true);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ date: "2026-08-16", userId: 7, createdBy: 7 }),
    );
  });

  it("bewaart een toelichting", async () => {
    await signUpForDay(null, form({ date: "2026-08-16", note: "enkel voormiddag" }));

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ note: "enkel voormiddag" }),
    );
  });

  it("doet niets wanneer je al ingeschreven staat", async () => {
    mockSelectLimit.mockResolvedValue([rij()]);

    const result = await signUpForDay(null, form({ date: "2026-08-16" }));

    expect(result.success).toBe(true);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("weigert wie niet ingelogd is", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await signUpForDay(null, form({ date: "2026-08-16" }));

    expect(result.success).toBe(false);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("weigert een onzinnige datum", async () => {
    const result = await signUpForDay(null, form({ date: "16 augustus" }));

    expect(result.success).toBe(false);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  // Story 14.7 — uren.
  describe("uren", () => {
    it("bewaart begin- en einduur", async () => {
      await signUpForDay(null, form({ date: "2026-08-16", startTime: "09:00", endTime: "12:00" }));

      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ startTime: "09:00", endTime: "12:00" }),
      );
    });

    it("bewaart een hele dag zonder uren als null", async () => {
      await signUpForDay(null, form({ date: "2026-08-16", startTime: "", endTime: "" }));

      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ startTime: null, endTime: null }),
      );
    });

    it("laat een tweede blok op dezelfde dag toe", async () => {
      mockSelectLimit.mockResolvedValue([rij({ startTime: "09:00", endTime: "12:00" })]);

      const result = await signUpForDay(
        null,
        form({ date: "2026-08-16", startTime: "14:00", endTime: "17:00" }),
      );

      expect(result.success).toBe(true);
      expect(mockInsertValues).toHaveBeenCalled();
    });

    it("weigert een blok dat overlapt met je eigen blok, en zegt met welk", async () => {
      mockSelectLimit.mockResolvedValue([rij({ startTime: "09:00", endTime: "12:00" })]);

      const result = await signUpForDay(
        null,
        form({ date: "2026-08-16", startTime: "11:00", endTime: "14:00" }),
      );

      expect(result.success).toBe(false);
      expect(result.success === false && result.error).toContain("09:00–12:00");
      expect(mockInsertValues).not.toHaveBeenCalled();
    });

    it("weigert een hele dag wanneer je al een blok hebt", async () => {
      mockSelectLimit.mockResolvedValue([rij({ startTime: "09:00", endTime: "12:00" })]);

      const result = await signUpForDay(null, form({ date: "2026-08-16" }));

      expect(result.success).toBe(false);
      expect(mockInsertValues).not.toHaveBeenCalled();
    });

    it("negeert de blokken van anderen", async () => {
      mockSelectLimit.mockResolvedValue([rij({ userId: 8, startTime: "09:00", endTime: "12:00" })]);

      const result = await signUpForDay(
        null,
        form({ date: "2026-08-16", startTime: "09:00", endTime: "12:00" }),
      );

      expect(result.success).toBe(true);
      expect(mockInsertValues).toHaveBeenCalled();
    });

    it("weigert een einduur vóór het beginuur", async () => {
      const result = await signUpForDay(
        null,
        form({ date: "2026-08-16", startTime: "12:00", endTime: "09:00" }),
      );

      expect(result.success).toBe(false);
      expect(result.success === false && result.fieldErrors?.endTime?.[0]).toBeTruthy();
      expect(mockInsertValues).not.toHaveBeenCalled();
    });

    it("weigert een einduur gelijk aan het beginuur", async () => {
      const result = await signUpForDay(
        null,
        form({ date: "2026-08-16", startTime: "09:00", endTime: "09:00" }),
      );

      expect(result.success).toBe(false);
    });

    it("weigert een einduur zonder beginuur", async () => {
      const result = await signUpForDay(null, form({ date: "2026-08-16", endTime: "12:00" }));

      expect(result.success).toBe(false);
      expect(result.success === false && result.fieldErrors?.startTime?.[0]).toBeTruthy();
    });

    it("geeft geen fout wanneer de databank een dubbel blok tegenhoudt (twee tabbladen)", async () => {
      mockInsertValues.mockRejectedValue(Object.assign(new Error("duplicate key"), { code: "23505" }));

      const result = await signUpForDay(null, form({ date: "2026-08-16" }));

      expect(result.success).toBe(true);
    });

    it("meldt een andere databankfout wél", async () => {
      mockInsertValues.mockRejectedValue(new Error("verbinding weg"));

      const result = await signUpForDay(null, form({ date: "2026-08-16" }));

      expect(result.success).toBe(false);
    });
  });
});

// Code-review 14.7.
describe("review 14.7", () => {
  it("herkent ook een dubbel blok dat drizzle verpakt (DrizzleQueryError met cause)", async () => {
    // drizzle-orm verpakt elke databankfout; de Postgres-code zit in `cause`.
    mockInsertValues.mockRejectedValue(
      Object.assign(new Error("Failed query"), { cause: { code: "23505" } }),
    );

    const result = await signUpForDay(null, form({ date: "2026-08-16" }));

    expect(result.success).toBe(true);
  });

  it("geeft de ingevulde uren terug bij een verkeerd einduur", async () => {
    const result = await signUpForDay(
      null,
      form({ date: "2026-08-16", startTime: "12:00", endTime: "09:00" }),
    );

    expect(result.success).toBe(false);
    expect(result.success === false && result.values).toMatchObject({
      date: "2026-08-16",
      startTime: "12:00",
      endTime: "09:00",
    });
  });

  it("geeft de ingevulde uren terug bij een overlap", async () => {
    mockSelectLimit.mockResolvedValue([rij({ startTime: "09:00", endTime: "12:00" })]);

    const result = await signUpForDay(
      null,
      form({ date: "2026-08-16", startTime: "11:00", endTime: "14:00" }),
    );

    expect(result.success).toBe(false);
    expect(result.success === false && result.values).toMatchObject({
      startTime: "11:00",
      endTime: "14:00",
    });
  });

  it("geeft naam en uren van de vrijwilliger terug bij een overlap", async () => {
    mockHasPermission.mockReturnValue(true);
    mockSelectLimit.mockResolvedValue([
      rij({ userId: null, guestName: "Tante Marie", startTime: "09:00", endTime: "12:00" }),
    ]);

    const result = await addPersonToDay(
      null,
      form({ date: "2026-08-16", guestName: "Tante Marie", startTime: "10:00", endTime: "11:00" }),
    );

    expect(result.success).toBe(false);
    expect(result.success === false && result.values).toMatchObject({
      guestName: "Tante Marie",
      startTime: "10:00",
      endTime: "11:00",
    });
  });
});

describe("addPersonToDay", () => {
  it("weigert iemand zonder schrijfrecht", async () => {
    const result = await addPersonToDay(null, form({ date: "2026-08-16", guestName: "Tante Marie" }));

    expect(result.success).toBe(false);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("schrijft een vrijwilliger zonder login in", async () => {
    mockHasPermission.mockReturnValue(true);

    const result = await addPersonToDay(null, form({ date: "2026-08-16", guestName: "Tante Marie" }));

    expect(result.success).toBe(true);
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null, guestName: "Tante Marie", createdBy: 7 }),
    );
  });

  it("weigert een lege naam en geeft de invoer terug", async () => {
    mockHasPermission.mockReturnValue(true);

    const result = await addPersonToDay(null, form({ date: "2026-08-16", guestName: "  " }));

    expect(result.success).toBe(false);
    expect(result.success === false && result.values?.date).toBe("2026-08-16");
  });

  // Story 14.7
  it("bewaart uren bij een vrijwilliger", async () => {
    mockHasPermission.mockReturnValue(true);

    await addPersonToDay(
      null,
      form({ date: "2026-08-16", guestName: "Tante Marie", startTime: "13:00", endTime: "16:00" }),
    );

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ startTime: "13:00", endTime: "16:00" }),
    );
  });

  it("weigert een overlappend blok voor dezelfde vrijwilliger", async () => {
    mockHasPermission.mockReturnValue(true);
    mockSelectLimit.mockResolvedValue([
      rij({ userId: null, guestName: "tante marie", startTime: "09:00", endTime: "12:00" }),
    ]);

    const result = await addPersonToDay(
      null,
      form({ date: "2026-08-16", guestName: "Tante Marie", startTime: "10:00", endTime: "11:00" }),
    );

    expect(result.success).toBe(false);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it("laat twee verschillende vrijwilligers op hetzelfde uur toe", async () => {
    mockHasPermission.mockReturnValue(true);
    mockSelectLimit.mockResolvedValue([
      rij({ userId: null, guestName: "Anja", startTime: "09:00", endTime: "12:00" }),
    ]);

    const result = await addPersonToDay(
      null,
      form({ date: "2026-08-16", guestName: "Tante Marie", startTime: "09:00", endTime: "12:00" }),
    );

    expect(result.success).toBe(true);
    expect(mockInsertValues).toHaveBeenCalled();
  });
});

describe("removeAttendance", () => {
  it("laat je je eigen inschrijving weghalen", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 5, userId: 7, date: "2026-08-16" }]);

    const result = await removeAttendance(null, form({ id: "5" }));

    expect(result.success).toBe(true);
    expect(mockDeleteWhere).toHaveBeenCalled();
  });

  it("belet dat je die van iemand anders weghaalt", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 5, userId: 8, date: "2026-08-16" }]);

    const result = await removeAttendance(null, form({ id: "5" }));

    expect(result.success).toBe(false);
    expect(mockDeleteWhere).not.toHaveBeenCalled();
  });

  it("laat de leiding elke inschrijving weghalen", async () => {
    mockHasPermission.mockReturnValue(true);
    mockSelectLimit.mockResolvedValue([{ id: 5, userId: 8, date: "2026-08-16" }]);

    const result = await removeAttendance(null, form({ id: "5" }));

    expect(result.success).toBe(true);
    expect(mockDeleteWhere).toHaveBeenCalled();
  });

  it("laat een gast enkel door de leiding weghalen", async () => {
    mockSelectLimit.mockResolvedValue([{ id: 5, userId: null, date: "2026-08-16" }]);

    const result = await removeAttendance(null, form({ id: "5" }));

    expect(result.success).toBe(false);
  });

  it("weigert een onbekende inschrijving", async () => {
    mockSelectLimit.mockResolvedValue([]);

    const result = await removeAttendance(null, form({ id: "99" }));

    expect(result.success).toBe(false);
    expect(mockDeleteWhere).not.toHaveBeenCalled();
  });
});
