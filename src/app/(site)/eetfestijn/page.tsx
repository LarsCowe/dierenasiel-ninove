import type { Metadata } from "next";
import Link from "next/link";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export const metadata: Metadata = {
  title: "Eetfestijn",
  description:
    "Het jaarlijkse eetfestijn van Dierenasiel Ninove. Kom gezellig eten en steun daarmee onze dieren!",
};

export default function EetfestijnPage() {
  return (
    <div className="pt-28 pb-20 bg-bg">
      <div className="max-w-3xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Evenement
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Eetfestijn
          </h1>
          <p className="text-text-light leading-relaxed max-w-lg mx-auto">
            Elk jaar organiseert Dierenasiel Ninove een eetfestijn om fondsen
            te werven voor de opvang en verzorging van onze dieren.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll className="mb-10">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
              Binnenkort meer info
            </h2>
            <p className="text-text-light leading-relaxed mb-6">
              De details voor het volgende eetfestijn worden binnenkort
              bekendgemaakt. Hou onze website en{" "}
              <a
                href="https://www.facebook.com/dierenasielninove"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:text-accent transition-colors underline"
              >
                Facebook-pagina
              </a>{" "}
              in de gaten!
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-all"
            >
              Neem contact op voor meer info
            </Link>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
              Koekjesverkoop
            </h2>
            <p className="text-text-light leading-relaxed mb-4">
              Onze jaarlijkse koekjesverkoop is opnieuw van start gegaan.
              Bestellen kan tot en met 6 maart 2026.
            </p>
            <p className="text-text-light leading-relaxed mb-4">
              Afhalen kan vanaf 21 maart 2026 in het dierenasiel Ninove.
            </p>
            <p className="text-text-light leading-relaxed">
              Bestellen kan via mail:{" "}
              <a
                href="mailto:honden@dierenasielninove.be?subject=Bestelling%20koekjes"
                className="text-primary font-semibold hover:text-accent transition-colors underline"
              >
                honden@dierenasielninove.be
              </a>
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}
