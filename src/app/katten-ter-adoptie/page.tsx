export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getAnimals } from "@/lib/queries/animals";
import AnimalGrid from "@/components/animals/AnimalGrid";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export const metadata: Metadata = {
  title: "Katten ter adoptie",
  description:
    "Bekijk alle katten die beschikbaar zijn voor adoptie bij Dierenasiel Ninove. Vind jouw nieuwe knuffelmaatje.",
};

export default async function KattenPage() {
  const cats = await getAnimals({ species: "kat" });

  return (
    <div className="pt-28 pb-20 bg-warm">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Katten
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Katten ter adoptie
          </h1>
          <p className="text-text-light max-w-xl mx-auto leading-relaxed">
            Onze katten zijn gechipt, geregistreerd en gesteriliseerd of
            gecastreerd. Wie geeft hen een warm mandje?
          </p>
        </AnimateOnScroll>

        <AnimalGrid animals={cats} />
      </div>
    </div>
  );
}
