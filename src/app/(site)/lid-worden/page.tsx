import type { Metadata } from "next";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import { IBAN } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Lid worden",
  description:
    "Word lid van Dierenasiel Ninove VZW en steun ons werk. Steunend lid (€20), beschermend lid (€30) of erelid (€45) per jaar.",
};

const TIERS = [
  {
    name: "Steunend lid",
    price: "€20",
    color: "bg-primary-light",
  },
  {
    name: "Beschermend lid",
    price: "€30",
    color: "bg-primary",
    featured: true,
  },
  {
    name: "Erelid",
    price: "€45",
    color: "bg-primary-dark",
  },
];

export default function LidWordenPage() {
  return (
    <div className="pt-28 pb-20 bg-bg">
      <div className="max-w-3xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Steun ons
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Lid worden
          </h1>
          <p className="text-text-light leading-relaxed max-w-lg mx-auto">
            Dankzij jullie steun zijn wij in staat om te blijven investeren in de
            werking van het asiel. Zelfs met een klein bedrag kan jij ook onze
            trouwe viervoeters helpen.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll className="mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all ${
                  tier.featured ? "ring-2 ring-accent" : ""
                }`}
              >
                <div
                  className={`${tier.color} text-white text-center py-6 px-4`}
                >
                  <h3 className="font-heading text-lg font-bold mb-1">
                    {tier.name}
                  </h3>
                  <div className="text-3xl font-bold">{tier.price}</div>
                  <div className="text-white/80 text-sm mt-1">per jaar</div>
                </div>
              </div>
            ))}
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <h2 className="font-heading text-xl font-bold text-primary-dark mb-4">
              Hoe lid worden?
            </h2>
            <p className="text-text-light leading-relaxed mb-4">
              Het lidgeld kan overgeschreven worden op rekeningnummer:
            </p>
            <div className="inline-block bg-gray-50 rounded-xl px-8 py-4 mb-4">
              <span className="font-mono text-lg font-bold text-primary-dark">
                {IBAN}
              </span>
            </div>
            <p className="text-sm text-text-light">
              Bij overschrijving graag als mededeling vermelden:{" "}
              <strong>&quot;lidgeld&quot;</strong> en eventueel je naam + adres.
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}
