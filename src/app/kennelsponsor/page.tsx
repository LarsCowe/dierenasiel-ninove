export const dynamic = "force-dynamic";

import type { Metadata } from "next";
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
          <div className="max-w-3xl mx-auto px-6">
            <AnimateOnScroll>
              <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6">
                Onze sponsors
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {sponsors.map((sponsor) => (
                  <a
                    key={sponsor.id}
                    href={sponsor.websiteUrl || "#"}
                    target={sponsor.websiteUrl ? "_blank" : undefined}
                    rel={sponsor.websiteUrl ? "noopener noreferrer" : undefined}
                    className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all text-center"
                  >
                    <p className="font-bold text-primary-dark">{sponsor.name}</p>
                  </a>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      )}
    </>
  );
}
