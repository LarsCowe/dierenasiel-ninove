/**
 * Playwright global teardown — re-seeds the database after all E2E tests
 * so only the original seed data remains.
 */
export default async function globalTeardown() {
  const baseURL = process.env.BASE_URL || "http://localhost:3000";
  const secret = process.env.API_SECRET;

  if (!secret) {
    console.warn("[teardown] API_SECRET not set — skipping database re-seed.");
    return;
  }

  console.log("[teardown] Re-seeding database with original test data...");

  const res = await fetch(`${baseURL}/api/e2e/seed`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[teardown] Seed failed (${res.status}): ${body}`);
  } else {
    console.log("[teardown] Database re-seeded successfully.");
  }
}
