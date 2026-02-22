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
  ];
}
