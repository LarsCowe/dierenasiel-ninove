import Link from "next/link";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export default function CtaBanner() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary-dark to-primary relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateOnScroll className="text-center relative z-10">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">
            Jij kan het verschil maken
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-lg mx-auto">
            Of je nu adopteert, vrijwilliger wordt of een donatie doet — elke
            bijdrage telt. Samen geven we elk dier de toekomst die het verdient.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/honden-ter-adoptie"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-dark rounded-full font-bold shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              🐾 Adopteer een dier
            </Link>
            <Link
              href="/steun-ons"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-bold shadow-lg shadow-accent/40 hover:bg-accent/90 hover:-translate-y-0.5 transition-all"
            >
              ❤️ Steun ons
            </Link>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
