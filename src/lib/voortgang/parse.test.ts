import { describe, it, expect } from "vitest";
import { parseSprintStatus, storyTitleFromMarkdown, titleFromSlug } from "./parse";

/**
 * De voortgangspagina leest sprint-status.yaml (via `npm run voortgang:sync`) in
 * plaats van een handgeschreven lijst — die liep 44 stories achter.
 */

const YAML = `# generated: 2026-02-24
development_status:
  # Epic 1: Backoffice Toegang & Dashboard
  epic-1: done
  1-1-beheerder-authenticatie-en-sessiebeveiliging: done
  1-2-rolgebaseerde-toegangscontrole-rbac: done
  epic-1-retrospective: optional

  # Epic 11: AnimalShelter.be API Integratie (read-only import/diff/merge)
  # 2026-07-26: KOERSWIJZIGING — credentials ontvangen.
  epic-11: in-progress
  11-1-animalshelter-api-client-en-bearer-auth: done  # read-only garantie
  11-6-katten-en-andere-dieren: drafted
  11-7-detail-endpoint-verrijking: geschrapt  # detail-endpoint is ARMER dan de lijst
  epic-11-retrospective: optional

  # Epic 12: Gedeelde teamkalender (nieuwe klantvraag Sven, 2026-07-25)
  epic-12: in-progress  # geparkeerd (wacht op feedback Sven)
  12-1-teamkalender-fase-1-aggregatie: done
  # 12-4 (extra afgeleide bronnen) = GESCHRAPT 2026-09-10.
  12-5-kalender-meerdaagse-events: done

  # Epic 13: Evenementenbeheer (nieuwe klantvraag Sven, 2026-07-28)
  epic-13: in-progress
  13-13-herinneringen-per-mail: backlog  # wacht op 3 beslissingen
  13-17-mail-bij-kostenregel: blocked  # wacht op beslissing
`;

const titels = {
  "1.1": "Beheerder-authenticatie & sessiebeveiliging",
  "11.1": "Alleen-lezen AnimalShelter-client",
};

describe("parseSprintStatus", () => {
  const epics = parseSprintStatus(YAML, titels);

  it("leest de epics in volgorde, met titel en status", () => {
    expect(epics.map((e) => [e.id, e.status])).toEqual([
      [1, "done"],
      [11, "in-progress"],
      [12, "in-progress"],
      [13, "in-progress"],
    ]);
    expect(epics[0].title).toBe("Backoffice Toegang & Dashboard");
    expect(epics[1].title).toBe("AnimalShelter.be API Integratie (read-only import/diff/merge)");
  });

  it("negeert een commentaar achter de epic-status", () => {
    expect(epics[2].status).toBe("in-progress");
  });

  it("gebruikt de meegegeven titel, en anders een titel uit de slug", () => {
    expect(epics[0].stories[0]).toEqual({ id: "1.1", title: "Beheerder-authenticatie & sessiebeveiliging", status: "done" });
    expect(epics[0].stories[1]).toEqual({ id: "1.2", title: "Rolgebaseerde toegangscontrole rbac", status: "done" });
  });

  it("laat geschrapte stories en retrospectives weg", () => {
    expect(epics[1].stories.map((s) => s.id)).toEqual(["11.1", "11.6"]);
    expect(epics[0].stories.map((s) => s.id)).toEqual(["1.1", "1.2"]);
  });

  it("vertaalt drafted naar klaar-voor-dev en blocked naar gepland", () => {
    expect(epics[1].stories[1].status).toBe("ready-for-dev");
    expect(epics[3].stories.find((s) => s.id === "13.17")?.status).toBe("backlog");
    expect(epics[3].stories.find((s) => s.id === "13.13")?.status).toBe("backlog");
  });

  it("negeert commentaarregels die op een story lijken", () => {
    expect(epics[2].stories.map((s) => s.id)).toEqual(["12.1", "12.5"]);
  });

  it("kent geen stories toe aan een onbekende status", () => {
    const [epic] = parseSprintStatus("  # Epic 2: X\n  epic-2: done\n  2-1-iets: onzin\n", {});
    expect(epic.stories).toEqual([]);
  });
});

describe("storyTitleFromMarkdown", () => {
  it("haalt de titel uit de eerste regel van een story-bestand, zonder backticks", () => {
    expect(storyTitleFromMarkdown("# Story 11.9: Een leeg `properties`-veld mag het scherm niet neerhalen\n\nStatus: done")).toEqual({
      id: "11.9",
      title: "Een leeg properties-veld mag het scherm niet neerhalen",
    });
  });

  it("geeft null voor een bestand dat geen story is", () => {
    expect(storyTitleFromMarkdown("# Epic 13 — vragen voor Sven")).toBeNull();
  });
});

describe("titleFromSlug", () => {
  it("maakt van de slug een leesbare zin", () => {
    expect(titleFromSlug("formulier-terug-naar-eigenaar")).toBe("Formulier terug naar eigenaar");
  });
});
