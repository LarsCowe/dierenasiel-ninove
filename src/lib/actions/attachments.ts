"use server";

import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { animalAttachments, animals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function deleteAttachment(
  id: number,
): Promise<ActionResult> {
  const permCheck = await requirePermission("animal:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const [attachment] = await db
    .select()
    .from(animalAttachments)
    .where(eq(animalAttachments.id, id))
    .limit(1);

  if (!attachment) {
    return { success: false, error: "Bijlage niet gevonden" };
  }

  await db.delete(animalAttachments).where(eq(animalAttachments.id, id));
  await del(attachment.fileUrl);

  await logAudit("delete_attachment", "animal_attachment", id, attachment, null);
  revalidatePath(`/beheerder/dieren/${attachment.animalId}`);

  return { success: true, data: undefined };
}

export async function setMainPhoto(
  attachmentId: number,
): Promise<ActionResult> {
  const permCheck = await requirePermission("animal:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const [attachment] = await db
    .select()
    .from(animalAttachments)
    .where(eq(animalAttachments.id, attachmentId))
    .limit(1);

  if (!attachment) {
    return { success: false, error: "Bijlage niet gevonden" };
  }

  if (!attachment.fileType.startsWith("image/")) {
    return { success: false, error: "Alleen een afbeelding kan als hoofdfoto worden ingesteld" };
  }

  const [updated] = await db
    .update(animals)
    .set({ imageUrl: attachment.fileUrl })
    .where(eq(animals.id, attachment.animalId))
    .returning();

  await logAudit("set_main_photo", "animal", attachment.animalId, attachment, {
    ...updated,
    imageUrl: attachment.fileUrl,
  });
  revalidatePath(`/beheerder/dieren/${attachment.animalId}`);

  return { success: true, data: undefined };
}
