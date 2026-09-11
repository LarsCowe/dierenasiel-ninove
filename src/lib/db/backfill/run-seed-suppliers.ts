import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { seedSuppliersFromLines } from "./seed-suppliers-from-lines";

seedSuppliersFromLines()
  .then((nieuw) => {
    console.log(nieuw.length > 0 ? `Toegevoegd: ${nieuw.join(", ")}` : "Niets toe te voegen.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Opvullen leverancierslijst mislukt:", err);
    process.exit(1);
  });
