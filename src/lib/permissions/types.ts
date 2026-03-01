import type { BackofficeRole } from "@/types";

// Permission format: resource:action — single source of truth
export const ALL_PERMISSIONS = [
  "animal:read",
  "animal:write",
  "medical:read",
  "medical:write",
  "medical:first_check",
  "adoption:read",
  "adoption:write",
  "walker:read",
  "walker:write",
  "kennel:read",
  "kennel:write",
  "report:read",
  "report:generate",
  "user:read",
  "user:manage",
  "settings:read",
  "settings:write",
  "audit:read",
  "workflow:read",
  "workflow:write",
  "website:read",
  "website:write",
  "gdpr:read",
  "gdpr:write",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export type PermissionMap = Record<BackofficeRole, readonly Permission[]>;
