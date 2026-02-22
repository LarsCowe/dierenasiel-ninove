export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/queries/pages";
import ContentPage from "@/components/ui/ContentPage";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("vrijwilligerswerk");
  return {
    title: page?.title || "Vrijwilligerswerk",
    description: page?.metaDescription || "Word vrijwilliger bij Dierenasiel Ninove.",
  };
}

export default async function VrijwilligerswerkPage() {
  const page = await getPageBySlug("vrijwilligerswerk");
  if (!page) notFound();
  return <ContentPage title={page.title} content={page.content} />;
}
