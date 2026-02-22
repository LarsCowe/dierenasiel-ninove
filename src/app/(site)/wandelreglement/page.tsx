import type { Metadata } from "next";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export const metadata: Metadata = {
  title: "Wandelreglement",
  description:
    "Reglement en uren voor het wandelen met de asielhonden van Dierenasiel Ninove.",
};

const RULES = [
  "Er kan gewandeld worden met de honden tijdens de openingsdagen van het asiel (maandag, woensdag, vrijdag en zaterdag). Dit tussen 10 en 12 uur. De wandelingen starten bij voorkeur tussen 10 en 11u30.",
  "Bij vriestemperaturen of temperaturen boven de 23 graden bekijken we of de wandelingen door kunnen gaan. Wij dragen zorg voor onze dieren en willen niet dat hun kussentjes bevroren of verbrand raken.",
  "De wandelaar dient ten minste 18 jaar oud te zijn of onder begeleiding van een volwassen persoon. De volwassen persoon is verantwoordelijk tijdens de wandeling.",
  "De wandelaar zorgt ervoor dat zijn gegevens bekend zijn voordat de wandeling begint.",
  'De wandelaar draagt tijdens de wandeling een fluo hesje van het dierenasiel.',
  'De wandelaar dient tijdens de wandeling telefonisch bereikbaar te zijn via het nummer opgegeven op het "wandelreglement".',
  "De keuze van de hond gebeurt in samenspraak met de wandelaar en de verantwoordelijke van het asiel. De toestemming tot wandelen kan men enkel verkrijgen van de verantwoordelijke.",
  "De honden worden altijd aan de leiband gehouden en mogen in geen enkel geval loslopen! Er wordt afstand gehouden tussen de dieren. De honden worden niet doorgegeven aan andere wandelaars of aan onbekenden.",
  "Tijdens de wandeling mogen de asielhonden niet vergezeld worden door eigen honden.",
  "De private eigendommen dienen gerespecteerd te worden.",
  "Iedere wandelaar is verplicht om poepzakjes bij te hebben. Deze kan je verkrijgen in het asiel. De uitwerpselen dienen onmiddellijk opgeruimd te worden in de mate van het mogelijke en kunnen gedeponeerd worden in de vuilbak aan het dierenasiel.",
  "Het wandelen met onze dieren is op eigen verantwoordelijkheid/risico.",
  "Dierenasiel Ninove vzw staat vrij om wandelaars te weigeren.",
  "Bij het niet naleven van voorgenoemde voorwaarden kunnen wandelingen geweigerd worden.",
  "De wandelaar dient zich akkoord te verklaren met het wandelreglement.",
];

export default function WandelreglementPage() {
  return (
    <div className="pt-28 pb-20 bg-bg">
      <div className="max-w-3xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Wandelen
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Wandelreglement
          </h1>
          <p className="text-text-light leading-relaxed max-w-lg mx-auto">
            Neem onderstaand reglement door voor je met een van de honden wenst
            te wandelen.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll className="mb-10">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <ol className="space-y-4">
              {RULES.map((rule, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-7 h-7 bg-primary/10 text-primary text-sm font-bold rounded-full flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-text-light leading-relaxed">{rule}</p>
                </li>
              ))}
            </ol>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
              Wandeluren
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { day: "Maandag", hours: "10:00 - 12:00" },
                { day: "Woensdag", hours: "10:00 - 12:00" },
                { day: "Vrijdag", hours: "10:00 - 12:00" },
                { day: "Zaterdag", hours: "10:00 - 12:00" },
              ].map((item) => (
                <div
                  key={item.day}
                  className="bg-gray-50 rounded-xl p-4 flex justify-between items-center"
                >
                  <span className="font-semibold text-primary-dark">
                    {item.day}
                  </span>
                  <span className="text-text-light font-mono">
                    {item.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}
