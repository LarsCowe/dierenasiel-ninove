import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { getSession } from "@/lib/auth/session";
import {
  getEventById,
  getEventTasks,
  getEventShifts,
  getEventMaterials,
} from "@/lib/queries/events";
import { eventRights } from "@/lib/events/access";
import { buildDraaiboekPrint, draaiboekFileName } from "@/lib/events/draaiboek-print";
import DraaiboekPdf from "@/components/beheerder/evenementen/DraaiboekPdf";

/**
 * Story 13.4 — het draaiboek van één evenement als PDF.
 *
 * Zelfde opzet als de kennelkaart-route (Story 10.43): de PDF hangt aan het
 * evenement, niet aan de rapportenmodule.
 *
 * Story 13.14 — ook de trekker van dít evenement mag afdrukken. Er staan geen
 * bedragen op het blad, dus dat mag.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return new Response("Niet ingelogd", { status: 401 });
  }

  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return new Response("Ongeldig evenement-ID", { status: 400 });
  }

  const event = await getEventById(eventId);
  if (!event) {
    return new Response("Evenement niet gevonden", { status: 404 });
  }
  if (!eventRights(session.role, session.userId, event.trekkerUserId).zien) {
    return new Response("Onvoldoende rechten", { status: 403 });
  }

  const [tasks, shifts, materials] = await Promise.all([
    getEventTasks(eventId),
    getEventShifts(eventId),
    getEventMaterials(eventId),
  ]);

  const model = buildDraaiboekPrint({
    // De trekker met account gaat voor op de vrije tekst, net als op de fiche.
    event: { ...event, responsible: event.trekkerName ?? event.responsible },
    tasks,
    shifts,
    materials,
    // Met vaste twee cijfers: "6/8/2026" leest slordig op een blad aan de muur.
    afgedruktOp: new Date().toLocaleDateString("nl-BE", {
      timeZone: "Europe/Brussels",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  });

  const element = createElement(DraaiboekPdf, { model });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${draaiboekFileName(event)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
