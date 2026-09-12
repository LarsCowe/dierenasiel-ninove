import { describe, it, expect } from "vitest";
import { lastDoneStory, latestDateInMarkdown, parseSprintStatus, storyTitleFromMarkdown, titleFromSlug } from "./parse";

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

describe("latestDateInMarkdown", () => {
  it("neemt de laatste datum uit het bestand (meestal de laatste regel van het Change Log)", () => {
    const md = `# Story 13.16: X

## Change Log

- 2026-09-11 — opgezet
- 2026-09-12 — gecommit als ce7c0ae
- 2026-09-10 — eerder al iets
`;
    expect(latestDateInMarkdown(md)).toBe("2026-09-12");
  });

  it("geeft null zonder datum", () => {
    expect(latestDateInMarkdown("# Story 2.5: Kennel\n\nStatus: done")).toBeNull();
  });

  it("laat zich niet vangen door een getal dat op een datum lijkt maar geen datum is", () => {
    expect(latestDateInMarkdown("chip 9810-00-12 en 2026-13-45")).toBeNull();
  });

  it("kijkt enkel in het Change Log wanneer dat er is (een voorbeeld-URL met een toekomstige week telt niet)", () => {
    const md = "# Story 14.5: X\n\n| Link | naar `/personeel?week=2026-12-14` |\n\n## Change Log\n\n- 2026-09-11 — done\n";
    expect(latestDateInMarkdown(md)).toBe("2026-09-11");
  });

  it("negeert een datum na de opgegeven grens (een afronding ligt nooit in de toekomst)", () => {
    expect(latestDateInMarkdown("- 2026-09-11 — done\n- 2027-01-01 — gepland", "2026-09-12")).toBe("2026-09-11");
  });
});

describe("doneOn en lastDoneStory", () => {
  const yaml = `  # Epic 10: Klantfeedback
  epic-10: in-progress
  10-63-dossier: done
  10-64-formulier: done
  # Epic 14: Personeel
  epic-14: in-progress
  14-3-plaatsjes: done
  14-8-weekpatroon: backlog
`;
  const datums = {
    "10.63": { doneOn: "2026-09-12", doneAt: "2026-09-12T10:00:00.000Z" },
    "10.64": { doneOn: "2026-09-12", doneAt: "2026-09-12T12:00:00.000Z" },
    "14.3": { doneOn: "2026-09-11", doneAt: "2026-09-11T22:00:00.000Z" },
  };

  it("zet de datum enkel op afgeronde stories", () => {
    const epics = parseSprintStatus(yaml, {}, datums);
    expect(epics[0].stories[1].doneOn).toBe("2026-09-12");
    expect(epics[1].stories[1].doneOn).toBeUndefined();
  });

  it("kiest de laatst afgeronde story op datum, en bij gelijke datum de laatste in het bestand", () => {
    const epics = parseSprintStatus(yaml, {}, { "10.63": { doneOn: "2026-09-12" }, "10.64": { doneOn: "2026-09-12" }, "14.3": { doneOn: "2026-09-11" } });
    expect(lastDoneStory(epics)?.id).toBe("10.64");
  });

  it("beslist bij gelijke datum op het tijdstip van het story-bestand, ook tegen de volgorde in", () => {
    const yaml2 = `  # Epic 10: A
  epic-10: in-progress
  10-64-formulier: done
  # Epic 13: B
  epic-13: in-progress
  13-16-leveranciers: done
`;
    const epics = parseSprintStatus(yaml2, {}, {
      "10.64": { doneOn: "2026-09-12", doneAt: "2026-09-12T13:00:00.000Z" },
      "13.16": { doneOn: "2026-09-12", doneAt: "2026-09-12T00:50:00.000Z" },
    });
    expect(lastDoneStory(epics)?.id).toBe("10.64");
  });

  it("valt terug op de volgorde in het bestand wanneer er geen datums zijn", () => {
    const epics = parseSprintStatus(yaml, {});
    expect(lastDoneStory(epics)?.id).toBe("14.3");
  });

  it("geeft undefined zonder afgeronde stories", () => {
    expect(lastDoneStory([{ id: 1, title: "x", status: "backlog", stories: [{ id: "1.1", title: "y", status: "backlog" }] }])).toBeUndefined();
  });
});
