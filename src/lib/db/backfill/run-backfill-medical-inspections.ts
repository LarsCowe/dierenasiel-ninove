import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { backfillMedicalInspections } from "./backfill-medical-inspections";

backfillMedicalInspections()
  .then(({ scanned, inserted, skipped }) => {
    console.log(
      `✓ Backfill voltooid: ${scanned} campagnes met legacy medische velden, ${inserted} gemigreerd, ${skipped} overgeslagen (al medische inspecties).`,
    );
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ Backfill gefaald:", err);
    process.exit(1);
  });
