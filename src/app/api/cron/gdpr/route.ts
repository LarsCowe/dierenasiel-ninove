import { flagExpiredRecords } from "@/lib/gdpr/retention";
import { logAudit } from "@/lib/audit";
import { RETENTION_DAYS } from "@/lib/constants";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.API_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await flagExpiredRecords(RETENTION_DAYS);

    await logAudit("gdpr.retention_check", "system", 0, null, {
      candidates: result.candidates,
      walkers: result.walkers,
      candidateIds: result.candidateIds,
      walkerIds: result.walkerIds,
      source: "cron",
      checkedAt: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      flagged: result,
    });
  } catch (err) {
    console.error("GDPR cron retention check failed:", err);
    return Response.json(
      { success: false, error: "Retention check failed" },
      { status: 500 },
    );
  }
}
