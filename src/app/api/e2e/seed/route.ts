import { NextResponse } from "next/server";
import { seedDatabaseHeadless } from "@/lib/actions/database-reset";

/**
 * POST /api/e2e/seed
 *
 * Re-seeds the database with original test data.
 * Protected by API_SECRET — only for E2E test teardown.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.API_SECRET;

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await seedDatabaseHeadless();
    return NextResponse.json({ ok: true, message: "Database re-seeded." });
  } catch (err) {
    console.error("E2E seed failed:", err);
    return NextResponse.json(
      { error: "Seed failed" },
      { status: 500 },
    );
  }
}
