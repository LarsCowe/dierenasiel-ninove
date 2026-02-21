import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-primary-dark via-primary to-primary-light overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute w-96 h-96 rounded-full bg-white -top-24 -right-12 animate-[float_20s_ease-in-out_infinite]" />
        <div className="absolute w-64 h-64 rounded-full bg-white -bottom-20 -left-16 animate-[float_15s_ease-in-out_infinite_reverse]" />
        <div className="absolute w-40 h-40 rounded-full bg-white top-[40%] right-[30%] animate-[float_18s_ease-in-out_infinite_2s]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Text content */}
        <div className="text-center lg:text-left">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Geef een dier{" "}
            <span className="text-accent-light">een tweede kans</span> op geluk
          </h1>
          <p className="text-lg text-white/85 leading-relaxed mb-9 max-w-lg mx-auto lg:mx-0">
            Dierenasiel Ninove VZW vangt verwaarloosde, achtergelaten en verloren
            dieren op. Samen zorgen we ervoor dat elk dier de liefde en het thuis
            krijgt dat het verdient.
          </p>
          <div className="flex gap-4 flex-wrap justify-center lg:justify-start">
            <Link
              href="/honden-ter-adoptie"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-bold shadow-lg shadow-accent/40 hover:bg-accent/90 hover:-translate-y-0.5 transition-all"
            >
              Bekijk onze dieren →
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/40 text-white rounded-full font-bold hover:bg-white/10 hover:-translate-y-0.5 transition-all"
            >
              Neem contact op
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-10 mt-12 pt-8 border-t border-white/15 justify-center lg:justify-start flex-wrap">
            {[
              { number: "275+", label: "Dieren geadopteerd per jaar" },
              { number: "45+", label: "Jaar ervaring" },
              { number: "100%", label: "Liefde & toewijding" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-heading text-3xl font-bold text-accent-light">
                  {stat.number}
                </div>
                <div className="text-sm text-white/70 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual grid */}
        <div className="flex justify-center">
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            {[
              { emoji: "🐕", gradient: "from-accent-light to-accent" },
              { emoji: "🐈", gradient: "from-[#a8dadc] to-[#457b9d]", offset: "translate-y-8" },
              { emoji: "🐇", gradient: "from-[#d8f3dc] to-[#95d5b2]", offset: "-translate-y-5" },
              { emoji: "🐾", gradient: "from-[#fde2e4] to-[#fad2e1]" },
            ].map((card) => (
              <div
                key={card.emoji}
                className={`aspect-square rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-6xl shadow-xl hover:scale-[1.03] transition-transform ${card.offset || ""}`}
              >
                {card.emoji}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
