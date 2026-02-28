export type WalkStatus = "normal" | "long" | "overdue";

/**
 * Determine the status of an active walk based on elapsed time.
 * - "overdue": > 4 hours (red)
 * - "long": > 2 hours (orange)
 * - "normal": <= 2 hours (green/default)
 */
export function getWalkStatus(startTime: string): WalkStatus {
  const diff = elapsedMinutes(startTime);
  if (diff > 240) return "overdue";
  if (diff > 120) return "long";
  return "normal";
}

/**
 * Format the elapsed time since startTime as a human-readable string.
 */
export function elapsedTime(startTime: string): string {
  const diff = elapsedMinutes(startTime);
  if (diff < 0) return "—";
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours > 0) return `${hours}u ${mins}min`;
  return `${mins}min`;
}

function elapsedMinutes(startTime: string): number {
  const now = new Date();
  const [h, m] = startTime.split(":").map(Number);
  const startMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes - startMinutes;
}
