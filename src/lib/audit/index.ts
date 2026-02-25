import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { headers } from "next/headers";

export async function logAudit(
  action: string,
  entityType: string,
  entityId: number | string,
  oldValue: unknown | null,
  newValue: unknown | null,
): Promise<void> {
  try {
    const session = await getSession();
    const userId = session?.userId ?? null;

    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      null;

    await db.insert(auditLogs).values({
      userId,
      action,
      entityType,
      entityId: typeof entityId === "string" ? parseInt(entityId, 10) : entityId,
      oldValue,
      newValue,
      ipAddress,
    });
  } catch {
    // Silent fail — audit logging must never break business logic
  }
}
