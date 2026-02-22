import Link from "next/link";
import Image from "next/image";
import type { Animal } from "@/types";
import { calculateAge, speciesLabel, genderLabel } from "@/lib/utils";

const badgeStyles: Record<string, string> = {
  nieuw: "bg-accent",
  dringend: "bg-red-500",
  gereserveerd: "bg-primary",
};

const speciesGradients: Record<string, string> = {
  hond: "from-accent-light/30 to-accent/20",
  kat: "from-[#a8dadc]/40 to-[#bee1e6]/30",
  konijn: "from-[#d8f3dc]/40 to-[#b7e4c7]/30",
  default: "from-gray-100 to-gray-200",
};

function getAnimalHref(animal: Animal): string {
  switch (animal.species) {
    case "hond":
      return `/honden-ter-adoptie/${animal.slug}`;
    case "kat":
      return `/katten-ter-adoptie/${animal.slug}`;
    default:
      return `/andere-dieren/${animal.slug}`;
  }
}

export default function AnimalCard({ animal }: { animal: Animal }) {
  const gradient =
    speciesGradients[animal.species] || speciesGradients.default;
  const href = getAnimalHref(animal);

  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:-translate-y-2 hover:shadow-xl transition-all duration-400"
    >
      {/* Image */}
      <div
        className={`aspect-[4/5] bg-gradient-to-br ${gradient} relative overflow-hidden rounded-2xl flex items-center justify-center`}
      >
        {animal.badge && (
          <span
            className={`absolute top-3.5 left-3.5 px-3.5 py-1 rounded-full text-xs font-bold text-white ${
              badgeStyles[animal.badge] || "bg-primary"
            }`}
          >
            {animal.badge.charAt(0).toUpperCase() + animal.badge.slice(1)}
          </span>
        )}
        {animal.imageUrl ? (
          <Image
            src={animal.imageUrl}
            alt={animal.name}
            fill
            className="object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <span className="text-7xl">
            {animal.species === "hond"
              ? "🐕"
              : animal.species === "kat"
              ? "🐈"
              : "🐾"}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-6">
        <h3 className="font-heading text-xl font-bold text-primary-dark mb-2">
          {animal.name}
        </h3>
        <div className="flex gap-4 mb-3 text-sm text-text-light">
          <span className="flex items-center gap-1">
            🐾 {speciesLabel(animal.species)}
          </span>
          <span className="flex items-center gap-1">
            🎂 {calculateAge(animal.dateOfBirth)}
          </span>
          <span className="flex items-center gap-1">
            {animal.gender === "reu" || animal.gender === "kater" || animal.gender === "mannetje" ? "♂" : "♀"}{" "}
            {genderLabel(animal.gender)}
          </span>
        </div>
        <p className="text-sm text-text-light leading-relaxed mb-4 line-clamp-2">
          {animal.shortDescription || animal.description}
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary group-hover:text-accent group-hover:gap-2.5 transition-all">
          Meer info →
        </span>
      </div>
    </Link>
  );
}
