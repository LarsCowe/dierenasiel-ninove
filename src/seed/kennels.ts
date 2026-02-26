import type { NewKennel } from "@/types";

function generateKennels(
  prefix: string,
  count: number,
  zone: string,
  capacity: number,
): NewKennel[] {
  return Array.from({ length: count }, (_, i) => ({
    code: `${prefix}${i + 1}`,
    zone,
    capacity,
    isActive: true,
  }));
}

export const kennelSeeds: NewKennel[] = [
  ...generateKennels("H", 12, "honden", 2),
  ...generateKennels("K", 8, "katten", 3),
  ...generateKennels("A", 4, "andere", 2),
];
