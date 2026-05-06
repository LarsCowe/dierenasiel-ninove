import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { backfillCampaignPhotos } from "./backfill-campaign-photos";

backfillCampaignPhotos()
  .then(({ scanned, inserted, skipped }) => {
    console.log(
      `✓ Backfill voltooid: ${scanned} campagnes met photoUrl, ${inserted} gemigreerd, ${skipped} overgeslagen (al foto's).`,
    );
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ Backfill gefaald:", err);
    process.exit(1);
  });
