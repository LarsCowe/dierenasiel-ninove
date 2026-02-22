import bcrypt from "bcryptjs";

export async function getUserSeeds() {
  const hash = await bcrypt.hash("admin123", 10);

  return [
    {
      email: "beheerder@dierenasielninove.be",
      passwordHash: hash,
      name: "Beheerder",
      role: "beheerder",
      isActive: true,
    },
    {
      email: "wandelaar@dierenasielninove.be",
      passwordHash: hash,
      name: "Wandelaar",
      role: "wandelaar",
      isActive: true,
    },
  ];
}
