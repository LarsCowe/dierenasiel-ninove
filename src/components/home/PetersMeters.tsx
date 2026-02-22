import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

const godparents = [
  {
    animal: "Ezels",
    sponsors: "Jan Maes & Hilde Mertens",
  },
  {
    animal: "Rocky",
    sponsors:
      "Jean-Pierre Van Hoegaerden & Els Massaer, Linda Everaert, Kathleen Van Eesbeke en Bernard Ertveldt",
  },
  {
    animal: "Vito",
    sponsors: "Christel De Coppel",
  },
  {
    animal: "Athena",
    sponsors: "Veronique Quartier",
  },
  {
    animal: "Tim",
    sponsors: "Wim Noët en Fabienne Devriendt",
  },
];

export default function PetersMeters() {
  return (
    <section className="py-24 bg-bg">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Steun een dier
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Peters en meters gezocht
          </h2>
          <p className="text-text-light max-w-2xl mx-auto leading-relaxed">
            Wij zijn op zoek naar peters en meters voor enkele van onze honden
            die reeds lange tijd in opvang verblijven. Zie jij het zitten om
            meter of peter te worden? Vanaf 40 euro per jaar kan een fiscaal
            attest verkregen worden.
          </p>
          <p className="text-sm text-text-light mt-3">
            Contacteer ons via{" "}
            <a
              href="mailto:info@dierenasielninove.be"
              className="text-primary font-semibold hover:text-accent transition-colors"
            >
              info@dierenasielninove.be
            </a>
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="max-w-2xl mx-auto space-y-3">
            {godparents.map((gp) => (
              <div
                key={gp.animal}
                className="bg-white rounded-xl p-5 shadow-sm flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-accent font-bold text-sm">
                    {gp.animal.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-primary-dark">
                    {gp.animal}
                  </h3>
                  <p className="text-sm text-text-light">{gp.sponsors}</p>
                </div>
              </div>
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
