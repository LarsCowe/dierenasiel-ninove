import { seedVeterinaryDiagnoses } from "./seed-veterinary-diagnoses";

seedVeterinaryDiagnoses()
  .then(({ inserted }) => {
    console.log(`✓ Seed voltooid: ${inserted} nieuwe diagnoses toegevoegd.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ Seed gefaald:", err);
    process.exit(1);
  });
