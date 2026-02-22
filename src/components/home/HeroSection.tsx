import Link from "next/link";
import Image from "next/image";
import { SITE_LOGO_URL } from "@/lib/constants";

const WIX = "https://static.wixstatic.com/media";

// Featured animal photos from the old website for the hero grid
const heroImages = [
  {
    src: `${WIX}/12c6b4_9feb8fc1bb464ef899363245fec44a25~mv2.jpg/v1/fill/w_600,h_600,al_c,q_80,enc_auto/12c6b4_9feb8fc1bb464ef899363245fec44a25~mv2.jpg`,
    alt: "Dieren in het asiel",
  },
  {
    src: `${WIX}/12c6b4_adc6c63de5144e0aa5d1abcb2f16d9a9~mv2.jpg/v1/fill/w_600,h_600,al_c,q_80,enc_auto/12c6b4_adc6c63de5144e0aa5d1abcb2f16d9a9~mv2.jpg`,
    alt: "Andere dieren in het asiel",
  },
  {
    src: `${WIX}/12c6b4_71b76aeabafa44d6b1612132d897fa1f~mv2.jpeg/v1/fill/w_600,h_600,al_c,q_80,enc_auto/12c6b4_71b76aeabafa44d6b1612132d897fa1f~mv2.jpeg`,
    alt: "Honden ter adoptie",
  },
  {
    src: `${WIX}/12c6b4_a9e7932650044215bbd9e40601ba6b22~mv2.jpg/v1/fill/w_600,h_600,al_c,q_80,enc_auto/12c6b4_a9e7932650044215bbd9e40601ba6b22~mv2.jpg`,
    alt: "Katten ter adoptie",
  },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-br from-primary-dark via-primary to-primary-light overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute w-96 h-96 rounded-full bg-white -top-24 -right-12 animate-[float_20s_ease-in-out_infinite]" />
        <div className="absolute w-64 h-64 rounded-full bg-white -bottom-20 -left-16 animate-[float_15s_ease-in-out_infinite_reverse]" />
        <div className="absolute w-40 h-40 rounded-full bg-white top-[40%] right-[30%] animate-[float_18s_ease-in-out_infinite_2s]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Text content */}
        <div className="text-center lg:text-left">
          {/* Mobile logo — large, centered above title */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="relative w-40 h-40">
              <Image
                src={SITE_LOGO_URL}
                alt="Dierenasiel Ninove logo"
                fill
                className="rounded-full bg-white/10 p-2 object-contain"
              />
            </div>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Geef een dier{" "}
            <span className="text-accent-light">een tweede kans</span> op geluk
          </h1>
          <div className="flex items-center gap-4 mb-9 justify-center lg:justify-start">
            <div className="shrink-0 relative w-[5.5rem] h-[5.5rem] hidden lg:block">
              <Image
                src={SITE_LOGO_URL}
                alt="Dierenasiel Ninove logo"
                fill
                className="rounded-full bg-white/10 p-1.5 object-contain"
              />
            </div>
            <p className="text-lg text-white/85 leading-relaxed max-w-lg">
              Het Dierenasiel Ninove (Denderwindeke) geeft nieuwe kansen aan
              dieren die een nieuwe thuis zoeken. Samen zorgen we ervoor dat elk
              dier de liefde en het thuis krijgt dat het verdient.
            </p>
          </div>
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

        {/* Visual grid with real photos */}
        <div className="flex justify-center mt-6">
          <div className="flex gap-4 max-w-sm">
            {/* Left column */}
            <div className="flex flex-col gap-4 flex-1">
              {[heroImages[0], heroImages[2]].map((img) => (
                <div
                  key={img.alt}
                  className="aspect-square rounded-3xl overflow-hidden shadow-xl hover:scale-[1.03] transition-transform"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            {/* Right column — shifted down for stagger effect */}
            <div className="flex flex-col gap-4 flex-1 translate-y-10">
              {[heroImages[1], heroImages[3]].map((img) => (
                <div
                  key={img.alt}
                  className="aspect-square rounded-3xl overflow-hidden shadow-xl hover:scale-[1.03] transition-transform"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
