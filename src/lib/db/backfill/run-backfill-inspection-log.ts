import { backfillInspectionLog } from "./backfill-inspection-log";

backfillInspectionLog()
  .then(({ scanned, created }) => {
    console.log(`✓ Inspectie-log backfill voltooid: ${scanned} campagnes gescand, ${created} entries aangemaakt.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ Backfill gefaald:", err);
    process.exit(1);
  });
