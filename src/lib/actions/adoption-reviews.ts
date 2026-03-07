"use server";

import { db } from "@/lib/db";
import { adoptionCandidates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const REVIEWERS = ["martine", "nathalie", "sven"] as const;
const REVIEW_VALUES = ["geschikt", "niet_weerhouden"] as const;

const reviewSchema = z.object({
  candidateId: z.coerce.number().positive(),
  reviewer: z.enum(REVIEWERS),
  value: z.enum(REVIEW_VALUES),
});

export function computeReviewResult(
  reviewMartine: string | null,
  reviewNathalie: string | null,
  reviewSven: string | null,
): string | null {
  const reviews = [reviewMartine, reviewNathalie, reviewSven].filter(Boolean) as string[];
  if (reviews.length === 0) return null;

  if (reviews.some((r) => r === "niet_weerhouden")) return "niet_weerhouden";
  if (reviews.length === 3 && reviews.every((r) => r === "geschikt")) return "geschikt";
  return "misschien";
}

export async function submitReview(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const permCheck = await requirePermission("adoption:write");
  if (permCheck && !permCheck.success) {
    return { success: false, error: permCheck.error };
  }

  const raw = {
    candidateId: formData.get("candidateId"),
    reviewer: formData.get("reviewer"),
    value: formData.get("value"),
  };

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Ongeldige invoer" };
  }

  const columnMap = {
    martine: "reviewMartine",
    nathalie: "reviewNathalie",
    sven: "reviewSven",
  } as const;

  const column = columnMap[parsed.data.reviewer];

  try {
    const [existing] = await db
      .select()
      .from(adoptionCandidates)
      .where(eq(adoptionCandidates.id, parsed.data.candidateId))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Kandidaat niet gevonden" };
    }

    await db
      .update(adoptionCandidates)
      .set({ [column]: parsed.data.value })
      .where(eq(adoptionCandidates.id, parsed.data.candidateId));

    const updatedReviews = {
      reviewMartine: column === "reviewMartine" ? parsed.data.value : existing.reviewMartine,
      reviewNathalie: column === "reviewNathalie" ? parsed.data.value : existing.reviewNathalie,
      reviewSven: column === "reviewSven" ? parsed.data.value : existing.reviewSven,
    };

    const result = computeReviewResult(
      updatedReviews.reviewMartine,
      updatedReviews.reviewNathalie,
      updatedReviews.reviewSven,
    );

    // Auto-update category based on review result
    if (result) {
      const categoryMap: Record<string, string> = {
        niet_weerhouden: "niet_weerhouden",
        geschikt: "goede_kandidaat",
        misschien: "mogelijks",
      };
      await db
        .update(adoptionCandidates)
        .set({ category: categoryMap[result], categorySetBy: "Beoordeling (automatisch)" })
        .where(eq(adoptionCandidates.id, parsed.data.candidateId));
    }

    await logAudit(
      "submit_adoption_review",
      "adoption_candidate",
      parsed.data.candidateId,
      { [column]: existing[column] },
      { [column]: parsed.data.value },
    );

    revalidatePath("/beheerder/adoptie");
    revalidatePath(`/beheerder/adoptie/${parsed.data.candidateId}`);

    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Er ging iets mis bij het opslaan." };
  }
}
