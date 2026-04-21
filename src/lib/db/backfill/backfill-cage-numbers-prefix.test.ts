import { describe, it, expect } from "vitest";
import { normalizeCageNumbersString } from "./backfill-cage-numbers-prefix";

describe("normalizeCageNumbersString", () => {
  it("retourneert null voor null input", () => {
    expect(normalizeCageNumbersString(null)).toBeNull();
  });

  it("voegt K-prefix toe aan raw nummers", () => {
    expect(normalizeCageNumbersString("15")).toBe("K15");
    expect(normalizeCageNumbersString("16")).toBe("K16");
  });

  it("laat reeds correct gevormde waarden ongewijzigd", () => {
    expect(normalizeCageNumbersString("K1,K2")).toBe("K1,K2");
    expect(normalizeCageNumbersString("K15")).toBe("K15");
  });

  it("upcaset lowercase k-prefix", () => {
    expect(normalizeCageNumbersString("k3")).toBe("K3");
  });

  it("normaliseert gemengde lijsten", () => {
    expect(normalizeCageNumbersString("K1, 5, k7")).toBe("K1,K5,K7");
  });

  it("skipt lege segmenten en trimt spaties", () => {
    expect(normalizeCageNumbersString("15,  , 16 ")).toBe("K15,K16");
  });

  it("laat onbekend formaat staan (geen data-verlies)", () => {
    expect(normalizeCageNumbersString("A5,K2")).toBe("A5,K2");
  });
});
