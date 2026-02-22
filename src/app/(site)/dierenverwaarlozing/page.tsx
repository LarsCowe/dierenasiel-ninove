import type { Metadata } from "next";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export const metadata: Metadata = {
  title: "Dierenverwaarlozing melden",
  description:
    "Informatie over het melden van dierenverwaarlozing en dierenmishandeling. Contacteer de politie of Inspectiedienst Dierenwelzijn Vlaanderen.",
};

export default function DierenverwaarlozingPage() {
  return (
    <div className="pt-28 pb-20 bg-bg">
      <div className="max-w-3xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Informatie
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark">
            Dierenverwaarlozing en dierenmishandeling
          </h1>
        </AnimateOnScroll>

        <AnimateOnScroll className="mb-12">
          <div className="space-y-4 text-text-light leading-relaxed">
            <p>
              Dierenasiel Ninove heeft <strong>niet de bevoegdheid</strong> om
              zelf controles op dierenmishandeling en -verwaarlozing uit te
              voeren. Wij vangen echter wel de verwaarloosde dieren op in
              opdracht van de politie en de inspectiedienst Dierenwelzijn en
              zorgen ervoor dat deze dieren de (medische) verzorging krijgen die
              ze nodig hebben.
            </p>
            <p>
              Enkel de <strong>politie</strong> en de{" "}
              <strong>inspectiedienst Dierenwelzijn</strong> hebben de
              bevoegdheden om controles uit te voeren.
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll className="mb-12">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
            <h2 className="font-heading text-xl font-bold text-red-800 mb-3">
              Dringende situaties
            </h2>
            <p className="text-red-700 leading-relaxed">
              Voor zeer dringende situaties (zoals levensbedreigende situaties
              voor het dier) contacteer je het best de{" "}
              <strong>politie</strong>. Steeds meer politiezones hebben een
              dienst waarin enkele agenten zich inzetten voor dierenwelzijn.
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6">
            Hoe melden?
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-primary-dark mb-2">
                Melden bij Vlaanderen
              </h3>
              <p className="text-text-light text-sm leading-relaxed mb-3">
                Via onderstaande link kan je meer informatie terugvinden over het
                melden van dierenverwaarlozing en -mishandeling:
              </p>
              <a
                href="https://www.vlaanderen.be/verwaarloosde-of-mishandelde-dieren-melden"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent transition-colors"
              >
                www.vlaanderen.be — Verwaarloosde of mishandelde dieren melden
                <span>→</span>
              </a>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="font-bold text-primary-dark mb-2">
                Klacht indienen bij de Inspectiedienst
              </h3>
              <p className="text-text-light text-sm leading-relaxed mb-3">
                Een klacht indienen bij de Inspectiedienst Dierenwelzijn
                Vlaanderen kan via het online formulier:
              </p>
              <a
                href="https://www.vlaanderen.be/een-klacht-indienen-bij-de-inspectiedienst-dierenwelzijn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-dark hover:-translate-y-0.5 transition-all"
              >
                Klacht indienen
              </a>
            </div>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="bg-warm rounded-2xl p-8">
            <h3 className="font-heading text-lg font-bold text-primary-dark mb-3">
              Wat doet het dierenasiel?
            </h3>
            <p className="text-text-light leading-relaxed">
              Wanneer dieren in beslag worden genomen door de politie of
              inspectiedienst, vangt Dierenasiel Ninove deze dieren op. Wij
              zorgen ervoor dat ze de medische en dagelijkse verzorging krijgen
              die ze nodig hebben, en begeleiden hen naar een nieuw, liefdevol
              thuis.
            </p>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}
