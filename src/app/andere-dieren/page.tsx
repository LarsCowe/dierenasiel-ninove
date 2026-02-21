export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { animals } from "@/lib/db/schema";
import { and, ne, notInArray, desc } from "drizzle-orm";
import AnimalGrid from "@/components/animals/AnimalGrid";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export const metadata: Metadata = {
  title: "Andere dieren ter adoptie",
  description:
    "Bekijk onze andere dieren: ezels, kippen, cavia's en meer. Dierenasiel Ninove vangt alle soorten dieren op.",
};

export default async function AndereDierenPage() {
  const otherAnimals = await db
    .select()
    .from(animals)
    .where(
      and(
        notInArray(animals.species, ["hond", "kat"]),
        ne(animals.status, "geadopteerd")
      )
    )
    .orderBy(desc(animals.createdAt));

  return (
    <div className="pt-28 pb-20 bg-warm">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Andere dieren
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Andere dieren ter adoptie
          </h1>
          <p className="text-text-light max-w-xl mx-auto leading-relaxed">
            Naast honden en katten vangen we ook ezels, kippen, hangbuikvarkens
            en andere dieren op. Deze verblijven momenteel aan Kerkveld 29.
          </p>
        </AnimateOnScroll>

        <AnimalGrid animals={otherAnimals} />
      </div>
    </div>
  );
}
