/**
 * Test data factories for E2E tests.
 * Generates unique data per test run to avoid conflicts.
 */

function uniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function createAnimalData(overrides: Record<string, string> = {}) {
  const id = uniqueId();
  return {
    name: `E2E-Hond-${id}`,
    species: "hond",
    gender: "reu",
    breed: "Labrador",
    color: "Goud",
    intakeDate: new Date().toISOString().split("T")[0],
    intakeReason: "afstand",
    shortDescription: `Testvriendelijke hond ${id}`,
    ...overrides,
  };
}

export function createCatData(overrides: Record<string, string> = {}) {
  const id = uniqueId();
  return {
    name: `E2E-Kat-${id}`,
    species: "kat",
    gender: "kater",
    breed: "Europees Korthaar",
    color: "Grijs",
    intakeDate: new Date().toISOString().split("T")[0],
    intakeReason: "zwerfhond",
    shortDescription: `Testkat ${id}`,
    ...overrides,
  };
}

export const TEST_USERS = {
  beheerder: {
    email: "sven@dierenasielninove.be",
    password: "admin-only",
    name: "Sven",
    role: "beheerder",
  },
  medewerker: {
    email: "jan@dierenasielninove.be",
    password: "admin-only",
    name: "Jan",
    role: "medewerker",
  },
  dierenarts: {
    email: "dr.peeters@dierenasielninove.be",
    password: "admin-only",
    name: "Dr. Peeters",
    role: "dierenarts",
  },
} as const;
