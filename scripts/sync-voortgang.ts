import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseSprintStatus, storyTitleFromMarkdown } from "../src/lib/voortgang/parse";
import titelsOud from "../src/lib/voortgang/titels-oud.json";

/**
 * `npm run voortgang:sync` — zet `_bmad-output/implementation-artifacts/sprint-status.yaml`
 * (buiten de repo) om naar `src/lib/voortgang/data.json` (in de repo), zodat de
 * voortgangspagina op Vercel de echte stand toont. Draai dit na elke story, samen
 * met het bijwerken van sprint-status.yaml.
 *
 * Titels: eerst de eerste regel van het story-bestand, dan de oude handgeschreven
 * titel (voor stories zonder bestand, vooral Epic 1-9), dan de slug.
 */

// Draait via npm vanuit dierenasiel-app/; de artefacten staan één map hoger.
const ARTIFACTS = resolve(process.env.BMAD_ARTIFACTS ?? join(process.cwd(), "..", "_bmad-output", "implementation-artifacts"));
const DOEL = join(process.cwd(), "src", "lib", "voortgang", "data.json");

function main() {
  const yamlPad = join(ARTIFACTS, "sprint-status.yaml");
  if (!existsSync(yamlPad)) {
    console.error(`sprint-status.yaml niet gevonden op ${yamlPad} (zet BMAD_ARTIFACTS als de map elders staat)`);
    process.exit(1);
  }

  const titels: Record<string, string> = { ...(titelsOud as Record<string, string>) };
  for (const bestand of readdirSync(ARTIFACTS)) {
    if (!/^\d+-\d+-.*\.md$/.test(bestand)) continue;
    const kop = storyTitleFromMarkdown(readFileSync(join(ARTIFACTS, bestand), "utf8"));
    if (kop) titels[kop.id] = kop.title;
  }

  const epics = parseSprintStatus(readFileSync(yamlPad, "utf8"), titels);
  const stories = epics.reduce((n, e) => n + e.stories.length, 0);
  const inhoud = { generatedAt: new Date().toISOString().slice(0, 10), epics };
  writeFileSync(DOEL, JSON.stringify(inhoud, null, 2) + "\n");
  console.log(`${epics.length} epics, ${stories} stories → ${DOEL}`);
}

main();
