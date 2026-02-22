export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/queries/pages";
import { getActiveSponsors } from "@/lib/queries/sponsors";
import ContentPage from "@/components/ui/ContentPage";
import AnimateOnScroll from "@/components/ui/AnimateOnScroll";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("kennelsponsor");
  return {
    title: page?.title || "Kennelsponsor",
    description: page?.metaDescription || "Word kennelsponsor bij Dierenasiel Ninove.",
  };
}

export default async function KennelsponsorPage() {
  const [page, sponsors] = await Promise.all([
    getPageBySlug("kennelsponsor"),
    getActiveSponsors(),
  ]);

  if (!page) notFound();

  return (
    <>
      <ContentPage title={page.title} content={page.content} />

      {sponsors.length > 0 && (
        <div className="pb-20 bg-bg">
          <div className="max-w-4xl mx-auto px-6">
            <AnimateOnScroll>
              <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6">
                Onze sponsors
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {sponsors.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all text-center"
                  >
                    {sponsor.logoUrl ? (
                      <div className="relative w-full aspect-[4/3] mb-2">
                        <Image
                          src={sponsor.logoUrl}
                          alt={sponsor.name}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      </div>
                    ) : null}
                    <p className="font-semibold text-primary-dark text-xs">
                      {sponsor.name}
                    </p>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      )}
    </>
  );
}
