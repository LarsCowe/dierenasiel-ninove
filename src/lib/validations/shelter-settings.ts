import { z } from "zod";

export const SHELTER_SETTING_KEYS = {
  WORKFLOW_ENABLED: "workflow_enabled",
  WORKFLOW_STEPBAR_VISIBLE: "workflow_stepbar_visible",
  WORKFLOW_AUTO_ACTIONS_ENABLED: "workflow_auto_actions_enabled",
  WALKING_CLUB_THRESHOLD: "walking_club_threshold",
} as const;

export type ShelterSettingKey = (typeof SHELTER_SETTING_KEYS)[keyof typeof SHELTER_SETTING_KEYS];

export const shelterSettingKeySchema = z.enum([
  SHELTER_SETTING_KEYS.WORKFLOW_ENABLED,
  SHELTER_SETTING_KEYS.WORKFLOW_STEPBAR_VISIBLE,
  SHELTER_SETTING_KEYS.WORKFLOW_AUTO_ACTIONS_ENABLED,
  SHELTER_SETTING_KEYS.WALKING_CLUB_THRESHOLD,
]);

const booleanValueSchema = z.boolean();
const thresholdValueSchema = z.number().int().positive();

export type WorkflowSettings = {
  workflowEnabled: boolean;
  stepbarVisible: boolean;
  autoActionsEnabled: boolean;
};

/**
 * Validate a setting value based on its key.
 * Returns { success: true, data } or { success: false, error }.
 */
export function shelterSettingValueSchema(
  key: string,
  value: unknown,
): { success: true; data: boolean | number } | { success: false; error: string } {
  switch (key) {
    case SHELTER_SETTING_KEYS.WORKFLOW_ENABLED:
    case SHELTER_SETTING_KEYS.WORKFLOW_STEPBAR_VISIBLE:
    case SHELTER_SETTING_KEYS.WORKFLOW_AUTO_ACTIONS_ENABLED: {
      const result = booleanValueSchema.safeParse(value);
      if (result.success) return { success: true, data: result.data };
      return { success: false, error: "Waarde moet een boolean zijn (true/false)." };
    }
    case SHELTER_SETTING_KEYS.WALKING_CLUB_THRESHOLD: {
      const result = thresholdValueSchema.safeParse(value);
      if (result.success) return { success: true, data: result.data };
      return { success: false, error: "Drempel moet een positief geheel getal zijn." };
    }
    default:
      return { success: false, error: `Onbekende instelling: ${key}` };
  }
}
