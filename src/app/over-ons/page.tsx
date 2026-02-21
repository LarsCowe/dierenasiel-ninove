import type { Metadata } from "next";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";
import { TEAM_MEMBERS, VOLUNTEERS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Over ons",
  description:
    "Leer meer over Dierenasiel Ninove VZW: onze geschiedenis, ons team en onze missie. Sinds 1980 geven we dieren een tweede kans.",
};

export default function OverOnsPage() {
  return (
    <div className="pt-28 pb-20 bg-bg">
      <div className="max-w-4xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Over ons
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Over Dierenasiel Ninove
          </h1>
          <p className="text-text-light max-w-2xl mx-auto leading-relaxed">
            Het Dierenasiel Ninove (Denderwindeke) geeft nieuwe kansen aan dieren
            die een nieuwe thuis zoeken.
          </p>
        </AnimateOnScroll>

        {/* History */}
        <AnimateOnScroll className="mb-16">
          <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6">
            Onze geschiedenis
          </h2>
          <div className="space-y-4 text-text-light leading-relaxed">
            <p>
              Dierenasiel Ninove VZW, ook bekend als Dierenbescherming Groot-Ninove,
              werd opgericht op <strong>6 maart 1980</strong> aan Kerkveld 29 in
              Denderwindeke. In 2014 namen <strong>Katrien Reygaerts</strong> en haar
              moeder <strong>Martine Van Den Steen</strong> het asiel over.
            </p>
            <p>
              Binnen een jaar na de overname vonden al 275 honden en katten een nieuw
              thuis via het asiel. De oorspronkelijke locatie raakte echter zwaar
              verouderd — koud, vochtig en niet geschikt voor verbouwingen door de
              agrarische zone.
            </p>
            <p>
              In <strong>april 2022</strong> kocht het asiel een voormalig
              landbouwgebouw aan de Minnenhofstraat 24, op ongeveer 2 km van de oude
              locatie. Na uitgebreide verbouwingen — nieuw dak, geïsoleerde wanden,
              24 kennels, klimaatbeheersing en geluidsisolatie — opende het nieuwe
              hondengebouw feestelijk op <strong>6-7 januari 2024</strong>.
            </p>
            <p>
              De honden verblijven nu in het moderne gebouw aan de Minnenhofstraat. De
              katten en andere dieren (ezels, kippen, hangbuikvarken) bevinden zich
              nog aan de Kerkveld-locatie. Het plan is om alle dieren binnen 10 jaar
              op de Minnenhofstraat te huisvesten.
            </p>
          </div>
        </AnimateOnScroll>

        {/* Team */}
        <AnimateOnScroll className="mb-16">
          <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6">
            Ons team
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.name}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl mb-4">
                  👤
                </div>
                <h3 className="font-bold text-primary-dark">{member.name}</h3>
                <p className="text-sm text-text-light">{member.role}</p>
              </div>
            ))}
          </div>
        </AnimateOnScroll>

        {/* Volunteers */}
        <AnimateOnScroll className="mb-16">
          <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6">
            Onze vrijwilligers
          </h2>
          <p className="text-text-light leading-relaxed mb-4">
            Ons asiel draait grotendeels op de inzet van fantastische vrijwilligers.
            Zonder hen zouden we ons werk niet kunnen doen.
          </p>
          <div className="flex flex-wrap gap-2">
            {VOLUNTEERS.map((name) => (
              <span
                key={name}
                className="px-4 py-2 bg-warm rounded-full text-sm font-semibold text-primary-dark"
              >
                {name}
              </span>
            ))}
          </div>
        </AnimateOnScroll>

        {/* Legal info */}
        <AnimateOnScroll>
          <div className="bg-gray-100 p-8 rounded-2xl">
            <h3 className="font-heading text-lg font-bold text-primary-dark mb-3">
              Juridische informatie
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-text-light">
              <div>
                <span className="font-semibold text-text">Rechtsvorm:</span> VZW
              </div>
              <div>
                <span className="font-semibold text-text">Ondernemingsnummer:</span>{" "}
                BE 0420.668.808
              </div>
              <div>
                <span className="font-semibold text-text">Opgericht:</span> 6 maart
                1980
              </div>
              <div>
                <span className="font-semibold text-text">IBAN:</span> BE98 0680 7888
                7093
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}
