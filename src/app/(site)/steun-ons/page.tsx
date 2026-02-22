import type { Metadata } from "next";
import Link from "next/link";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import { IBAN } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Giften & Steun",
  description:
    "Steun Dierenasiel Ninove met een financiële gift, materiaaldonatie of via je testament. Elke bijdrage telt!",
};

const SPONSOR_TIERS = [
  {
    name: "Kennelsponsor",
    price: "€125",
    description:
      "Reclame of naam van de firma wordt gedurende 1 jaar aan het dierenasiel vermeld op een affiche voorzien voor de kennelsponsors.",
    color: "bg-primary-light",
  },
  {
    name: "Kennelsponsor+",
    price: "€150",
    description:
      'Zelfde voorwaarden als de "kennelsponsor" + vermelding op de website met link naar de website van de sponsor.',
    color: "bg-primary",
    featured: true,
  },
  {
    name: "Hoofdsponsor",
    price: "€200",
    description:
      "Reclame of naam van de firma wordt gedurende 1 jaar op de grote banner aan de hoofdingang van ons dierenasiel geplaatst + op affiches en onderleggers tijdens ons eetfestijn.",
    color: "bg-primary-dark",
  },
  {
    name: "Vrije bijdrage",
    price: "€...",
    description: "Elk bedrag is welkom en wordt ten volle ingezet voor onze dieren.",
    color: "bg-accent",
  },
];

export default function SteunOnsPage() {
  return (
    <div className="pt-28 pb-20 bg-bg">
      <div className="max-w-3xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Steun ons
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Giften
          </h1>
          <p className="text-text-light leading-relaxed max-w-lg mx-auto">
            Dankzij jouw steun kunnen wij blijven zorgen voor de dieren in ons
            asiel. Elke bijdrage maakt een verschil.
          </p>
        </AnimateOnScroll>

        {/* Financiële giften */}
        <AnimateOnScroll className="mb-10">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
              Financiële giften
            </h2>
            <p className="text-text-light leading-relaxed mb-4">
              Je kan een eenmalige of maandelijkse financiële gift doen op
              volgend rekeningnummer:
            </p>
            <div className="text-center mb-4">
              <div className="inline-block bg-gray-50 rounded-xl px-8 py-4">
                <span className="font-mono text-lg font-bold text-primary-dark">
                  {IBAN}
                </span>
              </div>
            </div>
            <p className="text-text-light leading-relaxed mb-2">
              Voor een gift vanaf <strong>€40 per jaar</strong> ontvang je
              automatisch een <strong>fiscaal attest</strong>. Vermeld bij je
              storting &quot;gift&quot; of &quot;steun&quot; in de mededeling.
              Vergeet ook je rijksregisternummer niet te vermelden.
            </p>
          </div>
        </AnimateOnScroll>

        {/* Materiaal */}
        <AnimateOnScroll className="mb-10">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
              Materiaaldonaties
            </h2>
            <p className="text-text-light leading-relaxed mb-4">
              Momenteel hebben we meer dan voldoende materiaal voor honden en
              katten voorhanden. Enkel de volgende benodigdheden kunnen we
              steeds gebruiken:
            </p>
            <ul className="space-y-2 text-text-light mb-4">
              {["Kittenvoeding", "Javel", "Houtpellets"].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-accent rounded-full shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm text-text-light">
              Je bent altijd welkom in het dierenasiel (bij voorkeur tijdens de
              openingsuren) voor donatie van deze benodigdheden.
            </p>
          </div>
        </AnimateOnScroll>

        {/* Testament */}
        <AnimateOnScroll className="mb-10">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
              Nalatenschap
            </h2>
            <p className="text-text-light leading-relaxed">
              Uiteraard neem je jouw kinderen, naaste familie en andere
              dierbaren op in je testament. Maar mocht je daarvoor de ruimte
              hebben, dan hopen we dat je in je testament ook een plaatsje hebt
              voor onze vzw. Dit kan zelfs voordelig zijn voor je erfgenamen in
              de zijlijn zoals broers, zussen, neven en nichten. Je kan voor
              meer informatie het best terecht bij je notaris.
            </p>
          </div>
        </AnimateOnScroll>

        {/* Kennelsponsors */}
        <AnimateOnScroll className="mb-10">
          <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6 text-center">
            Kennelsponsors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {SPONSOR_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all ${
                  tier.featured ? "ring-2 ring-accent" : ""
                }`}
              >
                <div
                  className={`${tier.color} text-white text-center py-5 px-4`}
                >
                  <h3 className="font-heading text-lg font-bold mb-1">
                    {tier.name}
                  </h3>
                  <div className="text-3xl font-bold">{tier.price}</div>
                </div>
                <div className="bg-white p-4">
                  <p className="text-sm text-text-light leading-relaxed">
                    {tier.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </AnimateOnScroll>

        {/* Links */}
        <AnimateOnScroll className="text-center">
          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              href="/kennelsponsor"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-all"
            >
              Bekijk onze sponsors
            </Link>
            <Link
              href="/lid-worden"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-full font-bold hover:bg-primary/5 transition-all"
            >
              Lid worden
            </Link>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}
