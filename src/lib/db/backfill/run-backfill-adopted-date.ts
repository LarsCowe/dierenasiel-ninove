import { backfillAdoptedDate } from "./backfill-adopted-date";

backfillAdoptedDate()
  .then(({ updatedCount }) => {
    console.log(`✓ Backfill voltooid: ${updatedCount} dier(en) geüpdatet.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ Backfill gefaald:", err);
    process.exit(1);
  });
