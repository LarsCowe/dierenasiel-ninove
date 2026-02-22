import type { Metadata } from "next";
import Link from "next/link";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import { CONTACT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Adoptieprocedure honden",
  description:
    "Hoe verloopt een adoptie van een hond bij Dierenasiel Ninove? Lees hier de volledige procedure, voorwaarden en adoptieprijzen.",
};

const PRICING = [
  { age: "Jonger dan 6 maanden", price: "vanaf €400" },
  { age: "Tussen 6 maanden en 1,5 jaar", price: "vanaf €350" },
  { age: "Tussen 1,5 en 5 jaar", price: "vanaf €300" },
  { age: "Tussen 6 en 10 jaar", price: "vanaf €250" },
  { age: "Ouder dan 10 jaar", price: "€85 – €125" },
];

export default function AdoptieprocedurePage() {
  return (
    <div className="pt-28 pb-20 bg-bg">
      <div className="max-w-3xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Adoptie
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-4">
            Adoptieprocedure honden
          </h1>
          <p className="text-text-light">
            Bekijk ook de{" "}
            <Link
              href="/adoptieprocedure-kat"
              className="text-primary font-semibold hover:text-accent transition-colors"
            >
              adoptieprocedure voor katten
            </Link>
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6">
            Hoe verloopt een adoptie?
          </h2>
          <div className="space-y-4 text-text-light leading-relaxed">
            <p>
              Wij vragen om, voor adoptie, <strong>niet te telefoneren of
              spontaan langs te komen</strong>. Je kandidaat stellen doe je door
              een e-mail te sturen naar{" "}
              <a
                href={`mailto:${CONTACT.emailGeneral}`}
                className="text-primary font-semibold hover:text-accent transition-colors"
              >
                {CONTACT.emailGeneral}
              </a>{" "}
              met voldoende uitleg over uw woon-, werk- &amp; gezinssituatie,
              hoeveel beweging u de hond zal geven, ...
            </p>
            <p>
              Graag ook je adres en telefoonnummer vermelden. Foto&apos;s van je
              appartement/huis/tuin zijn ook zeker welkom. Wij bekijken alle
              aanvragen en nodigen dan de volgens ons meest geschikte kandidaat
              uit voor een kennismaking. Je ontvangt sowieso een antwoord
              (positief of negatief), maar dit kan enkele dagen (soms langer)
              duren. Kandidaturen zonder de gevraagde info worden niet behandeld.
            </p>
            <p>
              Bij de kennismaking ontvangen we graag <strong>alle leden van het
              gezin</strong> en eventuele eigen hond(en). Wees er zeker van dat
              iedereen overtuigd is om een hond te adopteren voor je met ons
              contact opneemt.
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll className="mb-12">
          <div className="bg-warm rounded-2xl p-8 space-y-4 text-text-light leading-relaxed">
            <h3 className="font-heading text-lg font-bold text-primary-dark">
              Belangrijke voorwaarden
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="text-accent font-bold shrink-0">1.</span>
                <span>
                  Wij <strong>reserveren geen honden</strong> voor meerdere
                  dagen. Het gebeurt te vaak dat ze dan te lang blijven zitten of
                  hun kans op adoptie missen.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold shrink-0">2.</span>
                <span>
                  Een <strong>proefperiode is niet mogelijk</strong>. Wij zoeken
                  voor onze honden een thuis voor de rest van hun leven, waar er
                  tijd en geduld wordt voor opgebracht. Als er zich toch
                  problemen voordoen, zijn wij er steeds om jullie te begeleiden.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold shrink-0">3.</span>
                <span>
                  Wij plaatsen enkel honden om <strong>binnen te leven</strong>{" "}
                  en een deel te zijn van het gezin. Ze mogen uiteraard overdag
                  (afhankelijk van het ras) wel buiten verblijven.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold shrink-0">4.</span>
                <span>
                  Wij zorgen van onze kant alvast voor een goede medische
                  screening maar het totaal doorlichten van een huisdier is niet
                  mogelijk. Als er na de adoptie toch een vooraf niet gekend
                  medisch probleem opduikt, contacteer dan steeds onmiddellijk
                  ons dierenasiel. In overleg met onze dierenarts wordt dan zeker
                  naar een oplossing gezocht.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold shrink-0">5.</span>
                <span>
                  Wij kunnen niet garant staan dat alle informatie van de vorige
                  eigenaar voor de volle 100% klopt.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold shrink-0">6.</span>
                <span>
                  Hou steeds rekening met een{" "}
                  <strong>aanpassingsperiode van 6 maanden</strong>.
                </span>
              </li>
            </ul>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6">
            Adoptieprijs
          </h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-primary-dark text-white">
                  <th className="px-6 py-3 text-sm font-bold">Leeftijd</th>
                  <th className="px-6 py-3 text-sm font-bold">Prijs</th>
                </tr>
              </thead>
              <tbody>
                {PRICING.map((row, i) => (
                  <tr
                    key={row.age}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-3.5 text-sm text-text">
                      {row.age}
                    </td>
                    <td className="px-6 py-3.5 text-sm font-bold text-primary-dark">
                      {row.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-text-light leading-relaxed">
            Als de hond door ons werd gecastreerd of gesteriliseerd, komt er{" "}
            <strong>€150 (castratie)</strong> of{" "}
            <strong>€220 (sterilisatie)</strong> bij.
          </p>
          <p className="mt-2 text-sm text-text-light">
            Betaalmogelijkheden: <strong>cash of Payconiq</strong>.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-8 text-center">
            <h3 className="font-heading text-xl font-bold text-primary-dark mb-3">
              Interesse in een van onze honden?
            </h3>
            <p className="text-text-light mb-6">
              Stuur een e-mail met je gegevens en situatie naar{" "}
              <a
                href={`mailto:${CONTACT.emailGeneral}`}
                className="text-primary font-semibold hover:text-accent transition-colors"
              >
                {CONTACT.emailGeneral}
              </a>
            </p>
            <Link
              href="/honden-ter-adoptie"
              className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white rounded-full font-bold shadow-lg shadow-accent/30 hover:bg-accent/90 hover:-translate-y-0.5 transition-all"
            >
              Bekijk onze honden
            </Link>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}
