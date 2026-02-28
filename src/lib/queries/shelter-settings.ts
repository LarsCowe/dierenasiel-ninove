import { db } from "@/lib/db";
import { shelterSettings } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { SHELTER_SETTING_KEYS, type WorkflowSettings } from "@/lib/validations/shelter-settings";

const DEFAULT_WALKING_CLUB_THRESHOLD = 10;

const DEFAULT_WORKFLOW_SETTINGS: WorkflowSettings = {
  workflowEnabled: true,
  stepbarVisible: true,
  autoActionsEnabled: true,
};

export async function getWalkingClubThreshold(): Promise<number> {
  try {
    const results = await db
      .select()
      .from(shelterSettings)
      .where(eq(shelterSettings.key, SHELTER_SETTING_KEYS.WALKING_CLUB_THRESHOLD))
      .limit(1);

    if (results.length === 0) return DEFAULT_WALKING_CLUB_THRESHOLD;

    const value = results[0].value;
    return typeof value === "number" ? value : DEFAULT_WALKING_CLUB_THRESHOLD;
  } catch (err) {
    console.error("getWalkingClubThreshold query failed:", err);
    return DEFAULT_WALKING_CLUB_THRESHOLD;
  }
}

export async function getShelterSetting(key: string): Promise<unknown> {
  try {
    const results = await db
      .select()
      .from(shelterSettings)
      .where(eq(shelterSettings.key, key))
      .limit(1);

    if (results.length === 0) return null;
    return results[0].value;
  } catch (err) {
    console.error(`getShelterSetting(${key}) query failed:`, err);
    return null;
  }
}

export async function getWorkflowSettings(): Promise<WorkflowSettings> {
  try {
    const workflowKeys = [
      SHELTER_SETTING_KEYS.WORKFLOW_ENABLED,
      SHELTER_SETTING_KEYS.WORKFLOW_STEPBAR_VISIBLE,
      SHELTER_SETTING_KEYS.WORKFLOW_AUTO_ACTIONS_ENABLED,
    ];

    const results = await db
      .select()
      .from(shelterSettings)
      .where(inArray(shelterSettings.key, workflowKeys));

    const map = new Map(results.map((r) => [r.key, r.value]));

    return {
      workflowEnabled: map.has(SHELTER_SETTING_KEYS.WORKFLOW_ENABLED)
        ? Boolean(map.get(SHELTER_SETTING_KEYS.WORKFLOW_ENABLED))
        : DEFAULT_WORKFLOW_SETTINGS.workflowEnabled,
      stepbarVisible: map.has(SHELTER_SETTING_KEYS.WORKFLOW_STEPBAR_VISIBLE)
        ? Boolean(map.get(SHELTER_SETTING_KEYS.WORKFLOW_STEPBAR_VISIBLE))
        : DEFAULT_WORKFLOW_SETTINGS.stepbarVisible,
      autoActionsEnabled: map.has(SHELTER_SETTING_KEYS.WORKFLOW_AUTO_ACTIONS_ENABLED)
        ? Boolean(map.get(SHELTER_SETTING_KEYS.WORKFLOW_AUTO_ACTIONS_ENABLED))
        : DEFAULT_WORKFLOW_SETTINGS.autoActionsEnabled,
    };
  } catch (err) {
    console.error("getWorkflowSettings query failed:", err);
    return DEFAULT_WORKFLOW_SETTINGS;
  }
}
