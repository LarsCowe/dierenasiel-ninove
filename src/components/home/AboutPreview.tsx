import Image from "next/image";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

const features = [
  {
    icon: "❤️",
    title: "Liefdevolle opvang",
    desc: "Elk dier krijgt persoonlijke aandacht en zorg",
  },
  {
    icon: "🩺",
    title: "Medische zorg",
    desc: "Vaccinaties, chip en sterilisatie inbegrepen",
  },
  {
    icon: "🤝",
    title: "Begeleiding",
    desc: "Advies en ondersteuning na adoptie",
  },
  {
    icon: "✅",
    title: "Erkend asiel",
    desc: "Officieel erkend door de Vlaamse overheid",
  },
];

export default function AboutPreview() {
  return (
    <section className="py-24 bg-bg" id="over-ons">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image side */}
          <AnimateOnScroll animation="fade-in-left">
            <div className="relative">
              <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-lg">
                <Image
                  src="https://static.wixstatic.com/media/12c6b4_3b08cbc1a12f429eb6e21f269800cef4~mv2.jpg/v1/fill/w_800,h_645,al_c,q_80,enc_auto/12c6b4_3b08cbc1a12f429eb6e21f269800cef4~mv2.jpg"
                  alt="Dierenasiel Ninove"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="absolute -bottom-5 -right-5 bg-accent text-white px-7 py-5 rounded-2xl shadow-lg text-center">
                <div className="font-heading text-3xl font-bold">275+</div>
                <div className="text-xs font-semibold opacity-90">
                  Adopties per jaar
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          {/* Text side */}
          <AnimateOnScroll animation="fade-in-right">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
              <span className="inline-block w-8 h-0.5 bg-accent rounded" />
              Over ons
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark leading-tight mb-5">
              Een warme thuis voor elk dier
            </h2>
            <p className="text-text-light leading-relaxed mb-4">
              Dierenasiel Ninove VZW is een erkend dierenasiel in Denderwindeke
              (Ninove), Oost-Vlaanderen. Wij vangen honden, katten en andere
              dieren op die achtergelaten, verwaarloosd of verloren zijn.
            </p>
            <p className="text-text-light leading-relaxed mb-8">
              Ons team van toegewijde vrijwilligers en medewerkers zorgt ervoor
              dat elk dier de medische zorg, liefde en aandacht krijgt die het
              verdient, in afwachting van een nieuw, liefdevol thuis.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-3 p-4 bg-gray-100 rounded-xl hover:bg-warm hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center text-sm shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{f.title}</h4>
                    <p className="text-xs text-text-light leading-snug">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
