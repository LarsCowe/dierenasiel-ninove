import { hasPermission } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  requiredPermission: Permission | null;
};

export const BEHEERDER_NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/beheerder", icon: "📊", requiredPermission: null },
  { label: "Dieren", href: "/beheerder/dieren", icon: "🐾", requiredPermission: "animal:read" },
  { label: "Medisch", href: "/beheerder/medisch", icon: "🏥", requiredPermission: "medical:read" },
  { label: "Adoptie", href: "/beheerder/adoptie", icon: "📋", requiredPermission: "adoption:read" },
  { label: "Wandelaars", href: "/beheerder/wandelaars", icon: "🚶", requiredPermission: "walker:read" },
  { label: "Kennels", href: "/beheerder/dieren/kennel", icon: "🏠", requiredPermission: "kennel:read" },
  { label: "Rapporten", href: "/beheerder/rapporten", icon: "📈", requiredPermission: "report:read" },
  { label: "Website", href: "/beheerder/website", icon: "🌐", requiredPermission: "website:read" },
  { label: "Gebruikers", href: "/beheerder/gebruikers", icon: "👥", requiredPermission: "user:read" },
  { label: "Instellingen", href: "/beheerder/instellingen", icon: "⚙️", requiredPermission: "settings:read" },
  { label: "Mailing", href: "/beheerder/mailing", icon: "✉️", requiredPermission: "adoption:read" },
];

export function getVisibleNavItems(role: string): NavItem[] {
  return BEHEERDER_NAV_ITEMS.filter(
    (item) =>
      !item.requiredPermission || hasPermission(role, item.requiredPermission),
  );
}

/**
 * Determines if a nav item is active using longest-match-wins logic.
 * Prevents parent routes (e.g. /beheerder/dieren) from staying active
 * when a more specific child route (e.g. /beheerder/dieren/kennel) matches.
 */
export function isNavItemActive(
  href: string,
  pathname: string,
  allHrefs?: readonly string[],
): boolean {
  if (href === "/beheerder") {
    return pathname === "/beheerder";
  }

  const matches = pathname === href || pathname.startsWith(href + "/");
  if (!matches) return false;

  // If allHrefs provided, check if a longer (more specific) href also matches
  if (allHrefs) {
    const hasLongerMatch = allHrefs.some(
      (other) =>
        other !== href &&
        other.length > href.length &&
        other.startsWith(href + "/") &&
        (pathname === other || pathname.startsWith(other + "/")),
    );
    if (hasLongerMatch) return false;
  }

  return true;
}
