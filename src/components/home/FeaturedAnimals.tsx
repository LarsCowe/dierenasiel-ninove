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
            Adoptie
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Dieren in de kijker
          </h2>
          <p className="text-text-light max-w-xl mx-auto leading-relaxed">
            Klik op de foto voor meer informatie! Voor alle honden klik op
            &quot;Onze honden&quot;, voor de katten: &quot;Onze katten&quot; of
            &quot;Onze andere dieren&quot;.
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
          <div className="flex gap-4 justify-center flex-wrap mb-6">
            <Link
              href="/honden-ter-adoptie"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-bold shadow-lg shadow-accent/40 hover:bg-accent/90 hover:-translate-y-0.5 transition-all"
            >
              Onze honden
            </Link>
            <Link
              href="/katten-ter-adoptie"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-bold shadow-lg shadow-accent/40 hover:bg-accent/90 hover:-translate-y-0.5 transition-all"
            >
              Onze katten
            </Link>
            <Link
              href="/andere-dieren"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-bold shadow-lg shadow-accent/40 hover:bg-accent/90 hover:-translate-y-0.5 transition-all"
            >
              Andere dieren
            </Link>
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/adoptieprocedure"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-full font-bold hover:bg-primary/5 transition-all"
            >
              Adoptieprocedure honden
            </Link>
            <Link
              href="/adoptieprocedure-kat"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-full font-bold hover:bg-primary/5 transition-all"
            >
              Adoptieprocedure katten
            </Link>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
