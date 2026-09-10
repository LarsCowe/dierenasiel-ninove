import { db } from "@/lib/db";
import {
  events,
  eventTasks,
  eventCosts,
  eventShifts,
  eventEvaluations,
  eventMaterials,
  users,
} from "@/lib/db/schema";
import { and, asc, desc, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { BACKOFFICE_ROLES } from "@/lib/constants";
import { taskReminders, type Reminder } from "@/lib/events/reminders";
import type { YearOverviewInput } from "@/lib/events/yearly";
import type { EventRow } from "@/lib/actions/events";
import type { EventTaskRow } from "@/lib/actions/event-tasks";
import type { EventCostRow } from "@/lib/actions/event-costs";
import type { EventShiftRow } from "@/lib/actions/event-shifts";
import type { EventEvaluationRow } from "@/lib/actions/event-evaluations";
import type { EventMaterialRow } from "@/lib/actions/event-materials";

/** Een evenement met de naam van zijn trekker erbij (story 13.14). */
export type EventWithTrekker = EventRow & { trekkerName: string | null };

/**
 * Alle evenementen, recentste datum eerst. Met `trekkerUserId` enkel die waarvan
 * die gebruiker trekker is — dat is wat een trekker zonder evenementenrecht ziet.
 */
export async function getEvents(
  opties: { trekkerUserId?: number } = {},
): Promise<EventWithTrekker[]> {
  const rows = await db
    .select({ event: events, trekkerName: users.name })
    .from(events)
    .leftJoin(users, eq(events.trekkerUserId, users.id))
    .where(
      opties.trekkerUserId !== undefined ? eq(events.trekkerUserId, opties.trekkerUserId) : undefined,
    )
    .orderBy(desc(events.date), desc(events.id));
  return rows.map((r) => ({ ...r.event, trekkerName: r.trekkerName }));
}

export async function getEventById(id: number): Promise<EventWithTrekker | null> {
  const [row] = await db
    .select({ event: events, trekkerName: users.name })
    .from(events)
    .leftJoin(users, eq(events.trekkerUserId, users.id))
    .where(eq(events.id, id))
    .limit(1);
  return row ? { ...row.event, trekkerName: row.trekkerName } : null;
}

/** Story 13.14 — trekt deze gebruiker minstens één evenement? Voor het menu en het dashboard. */
export async function isTrekkerOfAnyEvent(userId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.trekkerUserId, userId))
    .limit(1);
  return Boolean(row);
}

/** Story 13.14 — wie trekker kan worden: de actieve backoffice-accounts, op naam. */
export async function getTrekkerOptions(): Promise<{ id: number; name: string }[]> {
  return db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(inArray(users.role, [...BACKOFFICE_ROLES]), eq(users.isActive, true)))
    .orderBy(asc(users.name));
}

/**
 * De draaiboektaken van één evenement. De sortering per fase gebeurt in
 * `groupTasksByPhase` — hier volstaat een stabiele volgorde.
 */
export async function getEventTasks(eventId: number): Promise<EventTaskRow[]> {
  return db.select().from(eventTasks).where(eq(eventTasks.eventId, eventId));
}

/**
 * De kosten- en opbrengstlijnen van één evenement (story 13.5). Het splitsen en
 * optellen gebeurt in `splitCostLines` / `summarizeCosts`.
 */
export async function getEventCosts(eventId: number): Promise<EventCostRow[]> {
  return db.select().from(eventCosts).where(eq(eventCosts.eventId, eventId));
}

/**
 * Wie staat waar en wanneer (story 13.6). Het groeperen per dag en per post
 * gebeurt in `groupShiftsByDay`.
 */
export async function getEventShifts(eventId: number): Promise<EventShiftRow[]> {
  return db.select().from(eventShifts).where(eq(eventShifts.eventId, eventId));
}

/** De materiaallijst van één evenement (story 13.11). */
export async function getEventMaterials(eventId: number): Promise<EventMaterialRow[]> {
  return db.select().from(eventMaterials).where(eq(eventMaterials.eventId, eventId));
}

/**
 * Story 13.10 — wat de vorige editie ons leerde. Dit is waarom de evaluatie bestaat:
 * ze moet terugkomen wanneer je de volgende editie voorbereidt, niet in een la liggen.
 */
export async function getPreviousEditionLessons(
  copiedFromEventId: number | null,
): Promise<{ id: number; name: string; couldBeBetter: string | null; agreements: string | null } | null> {
  if (!copiedFromEventId) return null;

  const [row] = await db
    .select({
      id: events.id,
      name: events.name,
      couldBeBetter: eventEvaluations.couldBeBetter,
      agreements: eventEvaluations.agreements,
    })
    .from(events)
    .leftJoin(eventEvaluations, eq(eventEvaluations.eventId, events.id))
    .where(eq(events.id, copiedFromEventId))
    .limit(1);

  if (!row) return null;
  if (!row.couldBeBetter && !row.agreements) return null;
  return row;
}

/** De evaluatie van één evenement (story 13.9), of null zolang ze niet bestaat. */
export async function getEventEvaluation(eventId: number): Promise<EventEvaluationRow | null> {
  const [row] = await db
    .select()
    .from(eventEvaluations)
    .where(eq(eventEvaluations.eventId, eventId))
    .limit(1);
  return row ?? null;
}

/**
 * Story 13.8 — draaiboektaken die aandacht vragen: nog niet afgevinkt, met een
 * datum, en binnenkort of al voorbij. Taken van een geannuleerd evenement tellen
 * niet mee: daar valt niets meer te laat aan te komen.
 *
 * Met `trekkerUserId` enkel de taken van de evenementen die die gebruiker trekt
 * (story 13.14).
 *
 * Het filteren op de horizon gebeurt in `taskReminders` — daar zit ook de sortering
 * en de labeling, en zo blijft die logica testbaar zonder databank.
 */
export async function getEventTaskReminders(
  today: string,
  opties: { trekkerUserId?: number } = {},
): Promise<Reminder[]> {
  const rows = await db
    .select({
      id: eventTasks.id,
      eventId: events.id,
      eventName: events.name,
      phase: eventTasks.phase,
      title: eventTasks.title,
      date: eventTasks.date,
      time: eventTasks.time,
      responsible: eventTasks.responsible,
      done: eventTasks.done,
    })
    .from(eventTasks)
    .innerJoin(events, eq(eventTasks.eventId, events.id))
    .where(
      and(
        eq(eventTasks.done, false),
        isNotNull(eventTasks.date),
        ne(events.status, "geannuleerd"),
        opties.trekkerUserId !== undefined ? eq(events.trekkerUserId, opties.trekkerUserId) : undefined,
      ),
    );

  return taskReminders(rows, today);
}

/**
 * Story 13.12 — alles wat het jaaroverzicht nodig heeft, in drie selects.
 * Bij zo'n veertien evenementen per jaar is optellen in code goedkoper dan drie
 * groeperende queries, en het is dezelfde optelling als op de fiche.
 */
export async function getYearOverviewData(): Promise<YearOverviewInput> {
  const [alleEvents, alleCosts, alleEvaluations] = await Promise.all([
    db
      .select({
        id: events.id,
        name: events.name,
        type: events.type,
        status: events.status,
        date: events.date,
        endDate: events.endDate,
      })
      .from(events),
    db
      .select({
        eventId: eventCosts.eventId,
        kind: eventCosts.kind,
        budgetAmount: eventCosts.budgetAmount,
        actualAmount: eventCosts.actualAmount,
      })
      .from(eventCosts),
    db
      .select({
        eventId: eventEvaluations.eventId,
        visitors: eventEvaluations.visitors,
        paidPlates: eventEvaluations.paidPlates,
      })
      .from(eventEvaluations),
  ]);

  return { events: alleEvents, costs: alleCosts, evaluations: alleEvaluations };
}
