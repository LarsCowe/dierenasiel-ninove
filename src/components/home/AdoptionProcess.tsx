import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

const steps = [
  {
    number: 1,
    title: "Verken onze dieren",
    desc: "Bekijk de dieren op onze website of sociale media. Voel je een klik? Neem dan contact met ons op.",
  },
  {
    number: 2,
    title: "Neem contact op",
    desc: "Stuur ons een e-mail met je vraag. Bel of kom niet spontaan langs — we werken op afspraak.",
  },
  {
    number: 3,
    title: "Kennismaking",
    desc: "Na een screening nodigen we de meest geschikte kandidaten uit voor een persoonlijke kennismaking met het dier.",
  },
  {
    number: 4,
    title: "Welkom thuis!",
    desc: "Bij een goede match wordt de adoptie afgerond. Je krijgt alle informatie en nazorg om goed van start te gaan.",
  },
];

export default function AdoptionProcess() {
  return (
    <section className="py-24 bg-bg" id="adoptie">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Adoptieproces
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Hoe werkt adopteren?
          </h2>
          <p className="text-text-light max-w-xl mx-auto leading-relaxed">
            Wij willen voor elk dier het beste thuis vinden. Daarom doorloopt
            elke adoptie een zorgvuldig proces.
          </p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <AnimateOnScroll key={step.number} className="text-center px-6 py-8 relative">
              {/* Connector line */}
              {step.number < 4 && (
                <div className="hidden lg:block absolute top-[60px] right-[-16px] w-8 h-0.5 bg-gray-300" />
              )}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-light text-white font-heading text-2xl font-bold flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/30">
                {step.number}
              </div>
              <h3 className="text-lg font-bold text-primary-dark mb-2.5">
                {step.title}
              </h3>
              <p className="text-sm text-text-light leading-relaxed">
                {step.desc}
              </p>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
