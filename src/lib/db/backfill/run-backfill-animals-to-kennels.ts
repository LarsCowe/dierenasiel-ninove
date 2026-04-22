import { backfillAnimalsToKennels } from "./backfill-animals-to-kennels";

backfillAnimalsToKennels()
  .then(({ scanned, assigned, skipped }) => {
    console.log(`✓ Kennel-backfill voltooid: ${scanned} kandidaten, ${assigned} toegewezen, ${skipped} overgeslagen.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ Backfill gefaald:", err);
    process.exit(1);
  });
