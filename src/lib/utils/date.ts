/**
 * Get the UTC offset in hours for Europe/Brussels at the given date.
 * Returns 1 for CET (winter) or 2 for CEST (summer).
 */
function getBrusselsUtcOffsetHours(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Brussels",
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const tz = parts.find((p) => p.type === "timeZoneName");
  const match = tz?.value.match(/GMT([+-]\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

/**
 * Get start and end of "today" in Europe/Brussels timezone as UTC Date objects.
 * Handles DST transitions correctly (23h spring-forward / 25h fall-back days).
 */
export function getBelgianDayBounds(): { start: Date; end: Date } {
  const now = new Date();
  // sv-SE locale gives ISO YYYY-MM-DD format
  const belgianDateStr = now.toLocaleDateString("sv-SE", {
    timeZone: "Europe/Brussels",
  });
  const [year, month, day] = belgianDateStr.split("-").map(Number);

  // Midnight of this day in UTC, then adjust by Brussels offset at that moment
  const midnightUtc = new Date(Date.UTC(year, month - 1, day));
  const startOffset = getBrusselsUtcOffsetHours(midnightUtc);
  const start = new Date(midnightUtc.getTime() - startOffset * 3_600_000);

  // Midnight of next day in UTC, then adjust by Brussels offset at that moment
  const nextMidnightUtc = new Date(Date.UTC(year, month - 1, day + 1));
  const endOffset = getBrusselsUtcOffsetHours(nextMidnightUtc);
  const end = new Date(nextMidnightUtc.getTime() - endOffset * 3_600_000);

  return { start, end };
}

/**
 * Returns the number of days from today until the given date string (YYYY-MM-DD).
 * Positive = in the future, 0 or negative = today or past.
 */
export function daysUntil(dateStr: string): number {
  const deadline = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Returns Tailwind CSS classes for urgency badge coloring based on days remaining.
 * - ≤0: red (overdue), ≤3: orange (urgent), ≤7: yellow (upcoming), >7: gray (neutral)
 */
export function urgencyColor(days: number): string {
  if (days <= 0) return "text-red-700 bg-red-100";
  if (days <= 3) return "text-orange-700 bg-orange-100";
  if (days <= 7) return "text-yellow-700 bg-yellow-100";
  return "text-gray-600 bg-gray-100";
}

/**
 * Returns a human-readable Dutch label for a deadline based on days remaining.
 */
export function deadlineLabel(days: number): string {
  if (days <= 0) return "Verlopen!";
  if (days === 1) return "Morgen";
  return `${days} dagen`;
}
