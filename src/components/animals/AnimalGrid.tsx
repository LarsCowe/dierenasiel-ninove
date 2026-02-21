import type { Animal } from "@/types";
import AnimalCard from "./AnimalCard";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export default function AnimalGrid({ animals }: { animals: Animal[] }) {
  if (animals.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🐾</div>
        <h3 className="font-heading text-xl font-bold text-primary-dark mb-2">
          Geen dieren gevonden
        </h3>
        <p className="text-text-light">
          Er zijn momenteel geen dieren beschikbaar in deze categorie. Kijk later nog eens!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
      {animals.map((animal) => (
        <AnimateOnScroll key={animal.id}>
          <AnimalCard animal={animal} />
        </AnimateOnScroll>
      ))}
    </div>
  );
}
