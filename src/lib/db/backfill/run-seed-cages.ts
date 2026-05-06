import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { seedCages } from "./seed-cages";

seedCages()
  .then(({ inserted }) => {
    console.log(`✓ Seed voltooid: ${inserted} nieuwe kooien toegevoegd.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ Seed gefaald:", err);
    process.exit(1);
  });
