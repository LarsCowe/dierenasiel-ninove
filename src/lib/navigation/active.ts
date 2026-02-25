/**
 * Determines if a nav item is active using longest-match-wins logic.
 * Prevents parent routes (e.g. /beheerder/dieren) from staying active
 * when a more specific child route (e.g. /beheerder/dieren/kennel) matches.
 *
 * Separated from index.ts to avoid pulling server-only imports
 * (permissions -> session -> next/headers) into Client Components.
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
