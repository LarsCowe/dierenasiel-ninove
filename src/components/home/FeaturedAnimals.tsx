import Link from "next/link";
import { getFeaturedAnimals } from "@/lib/queries/animals";
import AnimalCard from "@/components/animals/AnimalCard";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export default async function FeaturedAnimals() {
  const animals = await getFeaturedAnimals();

  return (
    <section className="py-24 bg-warm" id="dieren">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Onze dieren
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Op zoek naar een nieuw baasje
          </h2>
          <p className="text-text-light max-w-xl mx-auto leading-relaxed">
            Deze lieve dieren wachten op een warm thuis. Wie weet zit jouw
            nieuwe beste vriend ertussen?
          </p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {animals.map((animal) => (
            <AnimateOnScroll key={animal.id}>
              <AnimalCard animal={animal} />
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll className="text-center mt-12">
          <Link
            href="/honden-ter-adoptie"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-bold shadow-lg shadow-accent/40 hover:bg-accent/90 hover:-translate-y-0.5 transition-all"
          >
            Bekijk alle dieren →
          </Link>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
