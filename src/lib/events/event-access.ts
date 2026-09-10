import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { eventRights } from "./access";

type Geweigerd = { success: false; error: string };

/**
 * Story 13.14 — de controle voor draaiboek, shiften en materiaal: de beheerder, of
 * de trekker van dít evenement. Vervangt daar `requirePermission("event:write")`.
 * Geeft `undefined` terug wanneer het mag, net als `requirePermission`.
 *
 * Wie dit aanroept bij bewerken, afvinken of verwijderen: geef het evenement van de
 * BESTAANDE regel mee, niet het `eventId` uit het formulier. Anders kan een trekker
 * via een aangepast formulier aan een ander evenement komen.
 */
export async function requireEventDraaiboekAccess(eventId: number): Promise<Geweigerd | undefined> {
  const session = await getSession();
  if (!session) return { success: false, error: "Niet ingelogd" };
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return { success: false, error: "Ongeldig evenement" };
  }

  const [event] = await db
    .select({ trekkerUserId: events.trekkerUserId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!event) return { success: false, error: "Evenement niet gevonden" };

  if (!eventRights(session.role, session.userId, event.trekkerUserId).draaiboek) {
    return { success: false, error: "Onvoldoende rechten" };
  }
  return undefined;
}
