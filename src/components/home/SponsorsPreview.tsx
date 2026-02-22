import Image from "next/image";
import Link from "next/link";
import { getActiveSponsors } from "@/lib/queries/sponsors";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export default async function SponsorsPreview() {
  const sponsors = await getActiveSponsors();

  if (sponsors.length === 0) return null;

  return (
    <section className="py-24 bg-warm">
      <div className="max-w-7xl mx-auto px-6">
        <AnimateOnScroll className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <span className="inline-block w-8 h-0.5 bg-accent rounded" />
            Dank aan onze sponsors
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-dark mb-5">
            Hartelijk dank aan onze hoofdsponsors!
          </h2>
        </AnimateOnScroll>

        <AnimateOnScroll>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {sponsors.map((sponsor) => (
              <div
                key={sponsor.id}
                className="bg-white p-3 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                title={sponsor.name}
              >
                {sponsor.logoUrl ? (
                  <div className="relative w-full aspect-[4/3]">
                    <Image
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 12.5vw"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[4/3] flex items-center justify-center text-xs font-semibold text-primary-dark text-center">
                    {sponsor.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll className="text-center mt-10">
          <Link
            href="/kennelsponsor"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary rounded-full font-bold hover:bg-primary/5 transition-all"
          >
            Word ook kennelsponsor
          </Link>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
