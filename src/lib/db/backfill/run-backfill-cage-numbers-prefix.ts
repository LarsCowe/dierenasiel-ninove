import { backfillCageNumbersPrefix } from "./backfill-cage-numbers-prefix";

backfillCageNumbersPrefix()
  .then(({ scanned, updated }) => {
    console.log(`✓ Backfill voltooid: ${scanned} rijen gescand, ${updated} genormaliseerd.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ Backfill gefaald:", err);
    process.exit(1);
  });
