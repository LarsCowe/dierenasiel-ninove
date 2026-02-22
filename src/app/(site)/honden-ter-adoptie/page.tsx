export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { getAnimals } from "@/lib/queries/animals";
import AnimalGrid from "@/components/animals/AnimalGrid";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export const metadata: Metadata = {
  title: "Honden ter adoptie",
  description:
    "Bekijk alle honden die beschikbaar zijn voor adoptie bij Dierenasiel Ninove. Vind jouw nieuwe trouwe viervoeter.",
};

export default async function HondenPage() {
  const dogs = await getAnimals({ species: "hond" });

  return (
    <div className="pt-28 pb-20 bg-warm">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Honden
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Onze honden ter adoptie
          </h1>
          <div className="max-w-2xl mx-auto space-y-3">
            <p className="text-accent font-semibold">
              Gelieve voor de adoptie niet te telefoneren of spontaan langs te
              komen.
            </p>
            <p className="text-text-light leading-relaxed text-sm">
              Door de (soms) vele aanvragen kunnen we helaas niet iedereen
              persoonlijk beantwoorden. We nemen contact op met de mensen die in
              aanmerking komen voor adoptie.
            </p>
            <p className="text-sm">
              <Link
                href="/contact"
                className="text-primary font-semibold hover:text-accent transition-colors"
              >
                Adoptieprocedure: klik hier
              </Link>
            </p>
          </div>
        </AnimateOnScroll>

        <AnimalGrid animals={dogs} />
      </div>
    </div>
  );
}
