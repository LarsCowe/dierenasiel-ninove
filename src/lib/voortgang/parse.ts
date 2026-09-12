/**
 * De voortgangspagina leest `sprint-status.yaml` (BMAD) in plaats van een
 * handgeschreven lijst — die liep 44 stories achter toen story 10.64 klaar was.
 *
 * Het yaml-bestand staat buiten de app-repo, dus Vercel heeft het niet. Daarom
 * zet `npm run voortgang:sync` het om naar `data.json` in de repo; deze module
 * is de pure vertaling en heeft geen bestandssysteem nodig.
 *
 * Het formaat is eenvoudig genoeg om zonder yaml-bibliotheek te lezen:
 *   # Epic 13: Evenementenbeheer (…)        → epic-titel
 *   epic-13: in-progress  # commentaar       → epic-status
 *   13-16-leverancierslijst: done  # …       → story
 *   epic-13-retrospective: optional          → overgeslagen
 */

export type StoryStatus = "done" | "review" | "in-progress" | "ready-for-dev" | "backlog";
export type EpicStatus = "done" | "in-progress" | "backlog";

export interface Story {
  id: string;
  title: string;
  status: StoryStatus;
}

export interface Epic {
  id: number;
  title: string;
  status: EpicStatus;
  stories: Story[];
}

/** Wat BMAD schrijft → wat de pagina toont. Geschrapt = weg van de pagina. */
const STORY_STATUS: Record<string, StoryStatus> = {
  done: "done",
  review: "review",
  "in-progress": "in-progress",
  "ready-for-dev": "ready-for-dev",
  drafted: "ready-for-dev",
  backlog: "backlog",
  blocked: "backlog",
};

const EPIC_STATUS: Record<string, EpicStatus> = {
  done: "done",
  "in-progress": "in-progress",
  backlog: "backlog",
};

/** "formulier-terug-naar-eigenaar" → "Formulier terug naar eigenaar". */
export function titleFromSlug(slug: string): string {
  const zin = slug.replace(/-/g, " ").trim();
  return zin.charAt(0).toUpperCase() + zin.slice(1);
}

/** De eerste regel van een story-bestand: "# Story 11.9: Titel" → id + titel. */
export function storyTitleFromMarkdown(markdown: string): { id: string; title: string } | null {
  const eerste = markdown.split(/\r?\n/, 1)[0] ?? "";
  const m = eerste.match(/^#\s*Story\s+(\d+\.\d+):\s*(.+)$/);
  if (!m) return null;
  return { id: m[1], title: m[2].replace(/`/g, "").trim() };
}

export function parseSprintStatus(yaml: string, titels: Record<string, string>): Epic[] {
  const epics: Epic[] = [];
  let huidige: Epic | null = null;

  for (const regel of yaml.split(/\r?\n/)) {
    const epicTitel = regel.match(/^\s*#\s*Epic\s+(\d+):\s*(.+?)\s*$/);
    if (epicTitel) {
      huidige = { id: Number(epicTitel[1]), title: epicTitel[2], status: "in-progress", stories: [] };
      epics.push(huidige);
      continue;
    }

    // Andere commentaarregels (ook die op een story lijken, zoals "# 12-4 … = GESCHRAPT").
    if (/^\s*#/.test(regel)) continue;

    const epicStatus = regel.match(/^\s*epic-(\d+):\s*(\S+)/);
    if (epicStatus) {
      const epic = epics.find((e) => e.id === Number(epicStatus[1]));
      if (epic) epic.status = EPIC_STATUS[epicStatus[2]] ?? epic.status;
      continue;
    }

    const story = regel.match(/^\s*(\d+)-(\d+)-([a-z0-9-]+):\s*(\S+)/);
    if (story && huidige) {
      const status = STORY_STATUS[story[4]];
      if (!status) continue;
      const id = `${story[1]}.${story[2]}`;
      huidige.stories.push({ id, title: titels[id] ?? titleFromSlug(story[3]), status });
    }
  }

  return epics;
}
