import { hasPermission } from "@/lib/permissions";
import type { Permission } from "@/lib/permissions";

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  requiredPermission: Permission | null;
  /** Story 13.14 — ook zichtbaar voor wie trekker is van minstens één evenement. */
  alsoForTrekker?: boolean;
};

export const BEHEERDER_NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/beheerder", icon: "📊", requiredPermission: null },
  { label: "Kalender", href: "/beheerder/kalender", icon: "📅", requiredPermission: null },
  { label: "Evenementen", href: "/beheerder/evenementen", icon: "🎉", requiredPermission: "event:read", alsoForTrekker: true },
  // Epic 14 — wie komt welke dag.
  { label: "Personeel", href: "/beheerder/personeel", icon: "🧑‍🤝‍🧑", requiredPermission: "staff:read" },
  { label: "Zwerfkatten", href: "/beheerder/dieren/zwerfkattenbeleid", icon: "🐈", requiredPermission: "stray_cat:read" },
  { label: "Dieren", href: "/beheerder/dieren", icon: "🐾", requiredPermission: "animal:read" },
  { label: "Medisch", href: "/beheerder/medisch", icon: "🏥", requiredPermission: "medical:read" },
  { label: "Adoptie", href: "/beheerder/adoptie", icon: "📋", requiredPermission: "adoption:read" },
  { label: "Kennels", href: "/beheerder/dieren/kennel", icon: "🏠", requiredPermission: "kennel:read" },
  { label: "Rapporten", href: "/beheerder/rapporten", icon: "📈", requiredPermission: "report:read" },
  { label: "Website", href: "/beheerder/website", icon: "🌐", requiredPermission: "website:read" },
  // Epic 11 — alleen-lezen koppeling met animalshelter.be.
  { label: "AnimalShelter", href: "/beheerder/animalshelter", icon: "🔗", requiredPermission: "animalshelter:read" },
  { label: "Mailing", href: "/beheerder/mailing", icon: "✉️", requiredPermission: "adoption:read" },
  { label: "Wandelaars", href: "/beheerder/wandelaars", icon: "🚶", requiredPermission: "walker:read" },
  { label: "GDPR", href: "/beheerder/gdpr", icon: "🔒", requiredPermission: "gdpr:read" },
  { label: "Gebruikers", href: "/beheerder/gebruikers", icon: "👥", requiredPermission: "user:read" },
  { label: "Instellingen", href: "/beheerder/instellingen", icon: "⚙️", requiredPermission: "settings:read" },
];

export interface NavOptions {
  /** Is deze gebruiker trekker van minstens één evenement? (story 13.14) */
  trekker?: boolean;
}

export function getVisibleNavItems(role: string, opties: NavOptions = {}): NavItem[] {
  return BEHEERDER_NAV_ITEMS.filter(
    (item) =>
      !item.requiredPermission ||
      hasPermission(role, item.requiredPermission) ||
      (item.alsoForTrekker === true && opties.trekker === true),
  );
}

// Re-export from separate file to keep Client Component imports clean
export { isNavItemActive } from "./active";
