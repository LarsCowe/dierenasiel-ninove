import type { PermissionMap } from "./types";
import { ALL_PERMISSIONS } from "./types";

/**
 * `event:read` / `event:write` staan bewust ENKEL bij de beheerder (story 13.3).
 * Sven, vraag 25/26 (2026-08-06): "Geldzaken en opbrengsten en zo enkel beheerders,
 * ik zou zelfs voorlopig alles zeggen … zal toch door mij gestuurd worden" en
 * "Enkel beheerders of trekkers". Een evenement is dus géén gedeelde module zoals
 * de kalender. Gaat dit later open naar medewerkers, dan komt er een aparte
 * `event:finance:read` bij — het kostenblok is dan al één afgebakend stuk scherm.
 *
 * Story 13.14 — de "trekker" uit vraag 26 is bewust GEEN rol: een gebruiker heeft
 * er maar één. Trekker is een eigenschap van een evenement (`events.trekker_user_id`)
 * en geeft, los van de rol, toegang tot het draaiboek van dát evenement. Zie
 * `src/lib/events/access.ts`.
 */

export const ROLE_PERMISSIONS: PermissionMap = {
  beheerder: ALL_PERMISSIONS,

  medewerker: [
    "animal:read",
    "animal:write",
    "medical:read",
    "medical:first_check",
    "adoption:read",
    "walker:read",
    "kennel:read",
    "kennel:write",
    "workflow:write",
    "website:read",
    "animalshelter:read",
    "staff:read",
  ],

  // `staff:read` sinds story 14.7 — Sven, vraag 6: "iedereen met back office toegang"
  // mag zien wie er komt (en zichzelf inschrijven, zie 14.1).
  dierenarts: [
    "animal:read",
    "medical:read",
    "medical:write",
    "medical:first_check",
    "staff:read",
  ],

  adoptieconsulent: [
    "animal:read",
    "adoption:read",
    "adoption:write",
    "staff:read",
  ],

  coördinator: [
    "animal:read",
    "medical:read",
    "adoption:read",
    "walker:read",
    "walker:write",
    "kennel:read",
    "report:read",
    "report:generate",
    "user:read",
    "settings:read",
    "audit:read",
    "workflow:read",
    "workflow:write",
    "website:read",
    "website:write",
    "animalshelter:read",
    "staff:read",
    "staff:write",
  ],
};
