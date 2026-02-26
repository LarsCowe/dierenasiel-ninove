import { describe, it, expect } from "vitest";
import { createAnimalTodoSchema, completeAnimalTodoSchema } from "./animal-todos";

const validData = {
  animalId: "1",
  type: "vaccinatie",
  description: "Eerste vaccinatie plannen",
};

describe("createAnimalTodoSchema", () => {
  it("accepts valid data", () => {
    const result = createAnimalTodoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("coerces string animalId to number", () => {
    const result = createAnimalTodoSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.animalId).toBe(1);
  });

  it("rejects missing animalId", () => {
    const result = createAnimalTodoSchema.safeParse({ ...validData, animalId: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects zero animalId", () => {
    const result = createAnimalTodoSchema.safeParse({ ...validData, animalId: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects negative animalId", () => {
    const result = createAnimalTodoSchema.safeParse({ ...validData, animalId: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = createAnimalTodoSchema.safeParse({ ...validData, type: "onbekend" });
    expect(result.success).toBe(false);
  });

  it("accepts all 15 valid types", () => {
    const types = [
      "vaccinatie", "paspoort", "chip", "operatie", "castratie",
      "sterilisatie", "ontworming", "vlooienbehandeling", "bloedonderzoek",
      "tandencontrole", "gewichtscontrole", "gedragstest", "fotosessie",
      "adoptievoorbereiding", "anders",
    ];
    for (const type of types) {
      const result = createAnimalTodoSchema.safeParse({ ...validData, type });
      expect(result.success).toBe(true);
    }
  });

  it("rejects empty description", () => {
    const result = createAnimalTodoSchema.safeParse({ ...validData, description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects description exceeding 2000 characters", () => {
    const result = createAnimalTodoSchema.safeParse({ ...validData, description: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("accepts description of exactly 2000 characters", () => {
    const result = createAnimalTodoSchema.safeParse({ ...validData, description: "x".repeat(2000) });
    expect(result.success).toBe(true);
  });

  it("accepts valid dueDate", () => {
    const result = createAnimalTodoSchema.safeParse({ ...validData, dueDate: "2026-03-15" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.dueDate).toBe("2026-03-15");
  });

  it("rejects invalid dueDate format", () => {
    const result = createAnimalTodoSchema.safeParse({ ...validData, dueDate: "15-03-2026" });
    expect(result.success).toBe(false);
  });

  it("accepts undefined dueDate", () => {
    const result = createAnimalTodoSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.dueDate).toBeUndefined();
  });

  it("treats empty string dueDate as undefined", () => {
    const result = createAnimalTodoSchema.safeParse({ ...validData, dueDate: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.dueDate).toBeUndefined();
  });

  it("accepts all valid priorities", () => {
    for (const priority of ["laag", "normaal", "hoog", "dringend"]) {
      const result = createAnimalTodoSchema.safeParse({ ...validData, priority });
      expect(result.success).toBe(true);
    }
  });

  it("defaults priority to normaal", () => {
    const result = createAnimalTodoSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priority).toBe("normaal");
  });

  it("rejects invalid priority", () => {
    const result = createAnimalTodoSchema.safeParse({ ...validData, priority: "kritiek" });
    expect(result.success).toBe(false);
  });
});

describe("completeAnimalTodoSchema", () => {
  it("accepts valid id", () => {
    const result = completeAnimalTodoSchema.safeParse({ id: "5" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe(5);
  });

  it("rejects zero id", () => {
    const result = completeAnimalTodoSchema.safeParse({ id: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects negative id", () => {
    const result = completeAnimalTodoSchema.safeParse({ id: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric id", () => {
    const result = completeAnimalTodoSchema.safeParse({ id: "abc" });
    expect(result.success).toBe(false);
  });
});
