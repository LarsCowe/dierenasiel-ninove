import type { Metadata } from "next";
import Link from "next/link";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export const metadata: Metadata = {
  title: "Een dier afstaan",
  description:
    "Informatie over het afstaan van een hond, kat of ander dier aan Dierenasiel Ninove. Enkel op afspraak.",
};

const DOG_PRICES = [
  { category: "Pup tot 6 maanden", price: "Gratis" },
  {
    category: "6 maanden - 2 jaar",
    price: "Vanaf €50 (grote honden vanaf €75)",
  },
  {
    category: "2 jaar - 8 jaar",
    price: "Vanaf €75 (grote honden vanaf €100)",
  },
  { category: "Ouder dan 8 jaar", price: "Neem contact op" },
];

const CAT_PRICES = [
  { category: "Kitten tot 6 maanden", price: "Gratis" },
  { category: "Vanaf 6 maanden", price: "Afhankelijk van de leeftijd" },
];

export default function EenDierAfstaanPage() {
  return (
    <div className="pt-28 pb-20 bg-bg">
      <div className="max-w-3xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Informatie
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Een dier afstaan
          </h1>
        </AnimateOnScroll>

        {/* Procedure */}
        <AnimateOnScroll className="mb-10">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
              Hoe verloopt het?
            </h2>
            <p className="text-text-light leading-relaxed mb-4">
              Je kan je hond enkel brengen <strong>na afspraak</strong>. Zorg
              ervoor dat je het volgende meebrengt:
            </p>
            <ul className="space-y-2 text-text-light mb-6">
              {[
                "Je identiteitskaart",
                "Het vaccinatieboekje",
                "Het geldige registratieformulier van de hond of kat op jouw naam",
                "Een knuffel of dekentje waar het dier vertrouwd mee is",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-accent rounded-full shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-text-light leading-relaxed mb-4">
              Op die manier heeft het dier een vertrouwd item en kan de
              overgang naar ons asiel soepeler verlopen. Samen met jou zullen
              we een gedragsfiche van het dier opstellen. Hoe meer informatie
              we hebben, hoe sneller we een geschikte nieuwe eigenaar kunnen
              vinden.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 font-semibold text-sm">
                LET OP! Je kunt geen dier afstaan dat niet van jou is.
              </p>
            </div>
          </div>
        </AnimateOnScroll>

        {/* Formulier */}
        <AnimateOnScroll className="mb-10">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
              Aanvraagformulier
            </h2>
            <p className="text-text-light leading-relaxed mb-6">
              Gelieve onderstaand formulier in te vullen met zoveel mogelijk
              info over uw dier. Wij nemen zo snel mogelijk contact met je op.
              Jammer genoeg werken we heel vaak met een wachtlijst, zeker voor
              grotere dieren.
            </p>
            <Link
              href="/afstand"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-bold shadow-lg shadow-accent/40 hover:bg-accent/90 hover:-translate-y-0.5 transition-all"
            >
              Vul het formulier in
            </Link>
          </div>
        </AnimateOnScroll>

        {/* Afstandsbijdrage */}
        <AnimateOnScroll className="mb-10">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
              Afstandsbijdrage
            </h2>
            <p className="text-text-light leading-relaxed mb-6">
              Een dier afstaan is niet gratis. We vragen een afstandsbijdrage
              om onze kosten te dekken, niet om winst te maken. Een meerprijs
              wordt aangerekend bij het ontbreken van de geldige documenten en
              vaccinaties. De bijdrage voor grote rassen is hoger dan voor
              kleine honden, omdat grote honden over het algemeen langer in
              onze opvang verblijven.
            </p>

            <h3 className="font-heading text-lg font-bold text-primary-dark mb-3">
              Honden
            </h3>
            <div className="bg-gray-50 rounded-xl overflow-hidden mb-6">
              {DOG_PRICES.map((item, i) => (
                <div
                  key={item.category}
                  className={`flex justify-between items-center px-5 py-3 ${
                    i !== DOG_PRICES.length - 1 ? "border-b border-gray-200" : ""
                  }`}
                >
                  <span className="text-text-light">{item.category}</span>
                  <span className="font-semibold text-primary-dark">
                    {item.price}
                  </span>
                </div>
              ))}
            </div>

            <h3 className="font-heading text-lg font-bold text-primary-dark mb-3">
              Katten
            </h3>
            <div className="bg-gray-50 rounded-xl overflow-hidden mb-6">
              {CAT_PRICES.map((item, i) => (
                <div
                  key={item.category}
                  className={`flex justify-between items-center px-5 py-3 ${
                    i !== CAT_PRICES.length - 1 ? "border-b border-gray-200" : ""
                  }`}
                >
                  <span className="text-text-light">{item.category}</span>
                  <span className="font-semibold text-primary-dark">
                    {item.price}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-blue-900 text-sm mb-2">
                Wat zijn geldige documenten?
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  - Vaccinatieboekje met vaccin dat niet ouder is dan 1 jaar
                </li>
                <li>
                  - Bewijs van identificatie van het dier, op jouw naam
                  geregistreerd. Meer informatie op{" "}
                  <a
                    href="https://www.huisdierinfo.be/adopteren-en-verkoop/verkoop-of-weggeven/een-nieuwe-thuis-voor-je-hond-of-kat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                  >
                    huisdierinfo.be
                  </a>
                </li>
              </ul>
            </div>

            <p className="text-sm text-text-light">
              In ons asiel kan je betalen met <strong>Payconiq</strong> of{" "}
              <strong>cash</strong>.
            </p>
          </div>
        </AnimateOnScroll>

        {/* Contact */}
        <AnimateOnScroll className="text-center">
          <p className="text-text-light mb-4">Heb je nog een vraag?</p>
          <a
            href="mailto:info@dierenasielninove.be"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-all"
          >
            Mail ons
          </a>
        </AnimateOnScroll>
      </div>
    </div>
  );
}
