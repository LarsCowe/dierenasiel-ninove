import { describe, it, expect } from "vitest";
import { ROLE_PERMISSIONS } from "./roles";
import { ALL_PERMISSIONS } from "./types";

describe("ROLE_PERMISSIONS", () => {
  it("defines all 5 backoffice roles", () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toHaveLength(5);
    expect(ROLE_PERMISSIONS).toHaveProperty("beheerder");
    expect(ROLE_PERMISSIONS).toHaveProperty("medewerker");
    expect(ROLE_PERMISSIONS).toHaveProperty("dierenarts");
    expect(ROLE_PERMISSIONS).toHaveProperty("adoptieconsulent");
    expect(ROLE_PERMISSIONS).toHaveProperty("coördinator");
  });

  it("gives beheerder ALL permissions", () => {
    expect(ROLE_PERMISSIONS.beheerder).toBe(ALL_PERMISSIONS);
  });

  it("gives medewerker animal:write but NOT user:manage", () => {
    expect(ROLE_PERMISSIONS.medewerker).toContain("animal:write");
    expect(ROLE_PERMISSIONS.medewerker).not.toContain("user:manage");
  });

  it("gives dierenarts medical:write", () => {
    expect(ROLE_PERMISSIONS.dierenarts).toContain("medical:write");
  });

  it("gives adoptieconsulent adoption:write but NOT medical:write", () => {
    expect(ROLE_PERMISSIONS.adoptieconsulent).toContain("adoption:write");
    expect(ROLE_PERMISSIONS.adoptieconsulent).not.toContain("medical:write");
  });

  it("gives coördinator workflow:write but NOT user:manage", () => {
    expect(ROLE_PERMISSIONS.coördinator).toContain("workflow:write");
    expect(ROLE_PERMISSIONS.coördinator).not.toContain("user:manage");
  });

  it("gives medewerker medical:first_check (not exclusive to dierenarts)", () => {
    expect(ROLE_PERMISSIONS.medewerker).toContain("medical:first_check");
    expect(ROLE_PERMISSIONS.dierenarts).toContain("medical:first_check");
  });

  it("restricts user:manage to beheerder only", () => {
    expect(ROLE_PERMISSIONS.beheerder).toContain("user:manage");
    expect(ROLE_PERMISSIONS.medewerker).not.toContain("user:manage");
    expect(ROLE_PERMISSIONS.dierenarts).not.toContain("user:manage");
    expect(ROLE_PERMISSIONS.adoptieconsulent).not.toContain("user:manage");
    expect(ROLE_PERMISSIONS.coördinator).not.toContain("user:manage");
  });

  it("restricts settings:write to beheerder only", () => {
    expect(ROLE_PERMISSIONS.beheerder).toContain("settings:write");
    expect(ROLE_PERMISSIONS.medewerker).not.toContain("settings:write");
    expect(ROLE_PERMISSIONS.dierenarts).not.toContain("settings:write");
    expect(ROLE_PERMISSIONS.adoptieconsulent).not.toContain("settings:write");
    expect(ROLE_PERMISSIONS.coördinator).not.toContain("settings:write");
  });
});
