import { getSession } from "@/lib/auth/session";
import { ROLE_PERMISSIONS } from "./roles";
import type { Permission } from "./types";
import type { ActionResult } from "@/types";

export { ROLE_PERMISSIONS } from "./roles";
export type { Permission, PermissionMap } from "./types";
export { ALL_PERMISSIONS } from "./types";

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export async function requirePermission(
  permission: Permission
): Promise<ActionResult<void> | undefined> {
  const session = await getSession();

  if (!session) {
    return { success: false, error: "Niet ingelogd" };
  }

  if (!hasPermission(session.role, permission)) {
    return { success: false, error: "Onvoldoende rechten" };
  }

  return undefined;
}
