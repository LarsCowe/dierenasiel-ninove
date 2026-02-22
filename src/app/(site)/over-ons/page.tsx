import type { Metadata } from "next";
import Image from "next/image";
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
            Over het dierenasiel
          </h1>
        </AnimateOnScroll>

        {/* Doel */}
        <AnimateOnScroll className="mb-16">
          <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6">
            Doel van het asiel
          </h2>
          <ul className="list-disc list-inside space-y-2 text-text-light leading-relaxed">
            <li>Geven van nieuwe kansen aan dieren die een nieuwe thuis zoeken.</li>
            <li>Het opvangen van verloren dieren.</li>
          </ul>
        </AnimateOnScroll>

        {/* Geschiedenis */}
        <AnimateOnScroll className="mb-16">
          <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6">
            Geschiedenis van het Dierenasiel Ninove
          </h2>
          <div className="space-y-4 text-text-light leading-relaxed">
            <p>
              Dierenasiel Ninove is ontstaan in <strong>1980</strong> op Kerkveld in
              Denderwindeke. Sinds januari <strong>2014</strong> hebben{" "}
              <strong>Martine Van Den Steen</strong> en dochter{" "}
              <strong>Katrien Reygaerts</strong> de uitbating van dit asiel
              overgenomen.
            </p>
            <p>
              Martine had reeds vele jaren ervaring in omgang met honden in haar
              trimsalon en was ook vele jaren actief in een hondenschool. Katrien
              kreeg de microbe van dierenvriend van thuis mee en studeerde voor
              dierenartsassistente: 2de en 3de graad dierenverzorging + Bachelor
              Agro- en Biotechnologie met als afstudeerrichting Dierenzorg. Zoon
              Peter Reygaerts, administratief deskundige, helpt mee bij de
              administratieve taken.
            </p>
            <p>
              Sinds januari <strong>2024</strong> hebben we, na een verplichte
              verhuis, onze intrek genomen in een volledig vernieuwd asiel in de
              Minnenhofstraat te Denderwindeke. Hier hebben we enkel plaats voor
              opvang van onze honden.
            </p>
            <p>
              Onze toekomstplannen zijn om ook hier een verblijf op te richten voor
              onze katten, die nu uit noodzaak in een ander gebouw in Ninove
              opgevangen en verzorgd worden. Alles samenbrengen is ons doel.
            </p>
            <p>
              We zijn dankbaar voor onze toffe medewerkers en vrijwilligers die mee
              instaan bij de werking van ons dierenasiel, zonder hen zou het niet
              lukken. Ons team kan je hieronder terugvinden.
            </p>
          </div>
        </AnimateOnScroll>

        {/* Team - Wie zijn we */}
        <AnimateOnScroll className="mb-16">
          <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6">
            Wie zijn we
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                <div className="relative w-full aspect-[3/4]">
                  <Image
                    src={member.imageUrl}
                    alt={member.name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-bold text-primary-dark text-sm">{member.name}</h3>
                  <p className="text-xs text-text-light">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </AnimateOnScroll>

        {/* Vrijwilligers */}
        <AnimateOnScroll className="mb-16">
          <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6">
            Onze vrijwilligers
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {VOLUNTEERS.map((volunteer) => (
              <div
                key={volunteer.name}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                <div className="relative w-full aspect-[3/4]">
                  <Image
                    src={volunteer.imageUrl}
                    alt={volunteer.name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-bold text-primary-dark text-sm">{volunteer.name}</h3>
                  <p className="text-xs text-text-light">Vrijwilliger</p>
                </div>
              </div>
            ))}
          </div>
        </AnimateOnScroll>

        {/* Juridische informatie */}
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
              <div>
                <span className="font-semibold text-text">HK:</span> 30408195
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </div>
  );
}
