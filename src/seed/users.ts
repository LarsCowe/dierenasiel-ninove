import bcrypt from "bcryptjs";

export async function getUserSeeds() {
  const hash = await bcrypt.hash("admin-only", 10);

  return [
    {
      email: "sven@dierenasielninove.be",
      passwordHash: hash,
      name: "Sven",
      role: "beheerder",
      isActive: true,
    },
    {
      email: "jan@dierenasielninove.be",
      passwordHash: hash,
      name: "Jan",
      role: "medewerker",
      isActive: true,
    },
    {
      email: "dr.peeters@dierenasielninove.be",
      passwordHash: hash,
      name: "Dr. Peeters",
      role: "dierenarts",
      isActive: true,
    },
    {
      email: "leen@dierenasielninove.be",
      passwordHash: hash,
      name: "Leen",
      role: "adoptieconsulent",
      isActive: true,
    },
    {
      email: "karin@dierenasielninove.be",
      passwordHash: hash,
      name: "Karin",
      role: "coördinator",
      isActive: true,
    },
  ];
}
