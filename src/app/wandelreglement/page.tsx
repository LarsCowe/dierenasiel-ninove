export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/queries/pages";
import ContentPage from "@/components/ui/ContentPage";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("wandelreglement");
  return {
    title: page?.title || "Wandelreglement",
    description: page?.metaDescription || "Regels voor het wandelen met onze asielhonden.",
  };
}

export default async function WandelreglementPage() {
  const page = await getPageBySlug("wandelreglement");
  if (!page) notFound();
  return <ContentPage title={page.title} content={page.content} />;
}
