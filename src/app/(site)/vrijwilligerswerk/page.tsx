import type { Metadata } from "next";
import Link from "next/link";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export const metadata: Metadata = {
  title: "Vrijwilligerswerk",
  description:
    "Word vrijwilliger bij Dierenasiel Ninove. Wandel met onze honden of help mee in het asiel.",
};

export default function VrijwilligerswerkPage() {
  return (
    <div className="pt-28 pb-20 bg-bg">
      <div className="max-w-3xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Doe mee
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Vrijwilligerswerk
          </h1>
        </AnimateOnScroll>

        <AnimateOnScroll className="mb-10">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
              Wandelen met de honden
            </h2>
            <p className="text-text-light leading-relaxed mb-4">
              Wandelen met de honden kan enkel op de openingsdagen van 10.00
              tot 12.00 uur. Je gegevens en telefoonnummer dien je achter te
              laten voor je gaat wandelen.
            </p>
            <p className="text-text-light leading-relaxed mb-6">
              Neem alvast ons{" "}
              <Link
                href="/wandelreglement"
                className="text-primary font-semibold hover:text-accent transition-colors underline"
              >
                wandelreglement
              </Link>{" "}
              door.
            </p>

            <h3 className="font-heading text-lg font-bold text-primary-dark mb-3">
              Wandeluren
            </h3>
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { day: "Maandag", hours: "10:00 - 12:00" },
                  { day: "Woensdag", hours: "10:00 - 12:00" },
                  { day: "Vrijdag", hours: "10:00 - 12:00" },
                  { day: "Zaterdag", hours: "10:00 - 12:00" },
                ].map((item) => (
                  <div key={item.day} className="flex justify-between py-1.5">
                    <span className="font-semibold text-primary-dark">
                      {item.day}
                    </span>
                    <span className="text-text-light">{item.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll className="text-center">
          <p className="text-text-light leading-relaxed mb-6">
            Wil je graag wandelen met onze honden? Stuur ons een mailtje!
          </p>
          <a
            href="mailto:honden@dierenasielninove.be?subject=kandidaat%20wandelen%20dierenasiel"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-bold shadow-lg shadow-accent/40 hover:bg-accent/90 hover:-translate-y-0.5 transition-all"
          >
            Stuur een mail
          </a>
        </AnimateOnScroll>
      </div>
    </div>
  );
}
