import type { Metadata } from "next";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import WalkerRegistrationForm from "@/components/wandelaar/WalkerRegistrationForm";

export const metadata: Metadata = {
  title: "Wandelaar Registratie",
  description:
    "Registreer je als wandelaar bij Dierenasiel Ninove. Na goedkeuring kan je onze honden uitlaten.",
};

export default function WandelaarRegistratiePage() {
  return (
    <div className="pt-28 pb-20 bg-bg">
      <div className="max-w-3xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Wandelaar worden
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Registreer als wandelaar
          </h1>
          <p className="text-text-light leading-relaxed max-w-lg mx-auto">
            Vul onderstaand formulier in om je te registreren als wandelaar. Na
            goedkeuring door de coördinator kan je onze honden uitlaten tijdens
            de wandeluren.
          </p>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-md">
            <WalkerRegistrationForm />
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}
