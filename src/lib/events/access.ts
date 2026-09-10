import { hasPermission } from "@/lib/permissions";
import { BACKOFFICE_ROLES } from "@/lib/constants";
import type { BackofficeRole } from "@/types";

/**
 * Story 13.14 — wie mag wat met één evenement.
 *
 * "Trekker" is geen rol maar een eigenschap van een evenement (`events.trekker_user_id`).
 * Een gebruiker heeft maar één rol, en een medewerker die één keer een evenement
 * trekt, mag daarvoor zijn medewerkersrechten niet kwijtspelen.
 *
 * Sven, vraag 25/26 (2026-08-06): "geldzaken enkel beheerders" en "aanmaken en het
 * draaiboek aanpassen: beheerders of trekkers". Vandaar de vier trappen hieronder.
 *
 * Eén pure functie, zodat het scherm en de acties dezelfde regel volgen.
 */

export interface EventRights {
  /** De fiche openen en het draaiboek afdrukken. */
  zien: boolean;
  /** Draaiboek, shiften en materiaal bewerken. */
  draaiboek: boolean;
  /** Kosten, opbrengsten en evaluatie zien — de evaluatie toont het netto-resultaat. */
  geld: boolean;
  /** Het evenement zelf bewerken, kopiëren of verwijderen, en de kosten invullen. */
  beheer: boolean;
}

export function isTrekker(
  userId: number | null | undefined,
  trekkerUserId: number | null | undefined,
): boolean {
  return userId != null && trekkerUserId != null && userId === trekkerUserId;
}

export function eventRights(
  role: string,
  userId: number | null | undefined,
  trekkerUserId: number | null | undefined,
): EventRights {
  const leest = hasPermission(role, "event:read");
  const schrijft = hasPermission(role, "event:write");
  // Review 13.14 — `trekker_user_id` blijft staan wanneer iemands rol later wijzigt.
  // Trekker telt dus enkel mee zolang die persoon backoffice-toegang heeft: de acties
  // en de PDF-route zijn ook bereikbaar vanuit bv. de wandelaarsapp.
  const trekker =
    BACKOFFICE_ROLES.includes(role as BackofficeRole) && isTrekker(userId, trekkerUserId);
  return {
    zien: leest || trekker,
    draaiboek: schrijft || trekker,
    geld: leest,
    beheer: schrijft,
  };
}
