"use server";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { requirePermission } from "@/lib/permissions";
import { getUserSeeds } from "@/seed/users";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function resetDatabase(): Promise<ActionResult> {
  const permCheck = await requirePermission("settings:write");
  if (permCheck) return permCheck;

  try {
    // Delete in FK-safe order (children before parents)

    // Mailing chain
    await db.delete(schema.mailingSendRecipients);
    await db.delete(schema.mailingSends);
    await db.delete(schema.mailingLists);

    // Adoption chain
    await db.delete(schema.postAdoptionFollowups);
    await db.delete(schema.adoptionContracts);
    await db.delete(schema.kennismakingen);
    await db.delete(schema.adoptionCandidates);

    // Medical chain
    await db.delete(schema.medicationLogs);
    await db.delete(schema.medications);
    await db.delete(schema.operations);
    await db.delete(schema.vetVisits);
    await db.delete(schema.dewormings);
    await db.delete(schema.vaccinations);

    // Animal-related
    await db.delete(schema.animalTodos);
    await db.delete(schema.behaviorRecords);
    await db.delete(schema.feedingPlans);
    await db.delete(schema.neglectReports);
    await db.delete(schema.animalWorkflowHistory);
    await db.delete(schema.animalAttachments);

    // Walks
    await db.delete(schema.walks);
    await db.delete(schema.walkers);

    // Stray cats
    await db.delete(schema.strayCatCampaigns);
    await db.delete(schema.vetInspectionReports);

    // Other entities
    await db.delete(schema.contactSubmissions);
    await db.delete(schema.animals);
    await db.delete(schema.kennels);
    await db.delete(schema.kennelSponsors);
    await db.delete(schema.newsArticles);
    await db.delete(schema.pages);
    await db.delete(schema.auditLogs);
    await db.delete(schema.users);

    // Re-insert shelter settings defaults
    await db.delete(schema.shelterSettings);
    const settingsDefaults = [
      { key: "walking_club_threshold", value: 10 },
      { key: "workflow_enabled", value: true },
      { key: "workflow_stepbar_visible", value: true },
      { key: "workflow_auto_actions_enabled", value: true },
    ];
    for (const setting of settingsDefaults) {
      await db.insert(schema.shelterSettings).values(setting);
    }

    // Re-insert seed users
    const userSeeds = await getUserSeeds();
    for (const user of userSeeds) {
      await db.insert(schema.users).values(user);
    }

    revalidatePath("/");

    return {
      success: true,
      data: undefined,
      message: "Database is volledig gewist en standaardinstellingen zijn hersteld.",
    };
  } catch (err) {
    console.error("resetDatabase failed:", err);
    return {
      success: false,
      error: "Er ging iets mis bij het wissen van de database.",
    };
  }
}
