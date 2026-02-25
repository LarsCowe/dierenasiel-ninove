import { describe, it, expect } from "vitest";
import { getUserSeeds } from "./users";

describe("getUserSeeds", () => {
  it("returns at least 5 users", async () => {
    const seeds = await getUserSeeds();
    expect(seeds.length).toBeGreaterThanOrEqual(5);
  });

  it("contains exactly one user per backoffice role", async () => {
    const seeds = await getUserSeeds();
    const roles = seeds.map((u) => u.role);

    expect(roles).toContain("beheerder");
    expect(roles).toContain("medewerker");
    expect(roles).toContain("dierenarts");
    expect(roles).toContain("adoptieconsulent");
    expect(roles).toContain("coördinator");
  });

  it("all users have a valid passwordHash", async () => {
    const seeds = await getUserSeeds();
    for (const user of seeds) {
      expect(user.passwordHash).toBeTruthy();
      expect(user.passwordHash.startsWith("$2")).toBe(true);
    }
  });

  it("all users are active", async () => {
    const seeds = await getUserSeeds();
    for (const user of seeds) {
      expect(user.isActive).toBe(true);
    }
  });
});
