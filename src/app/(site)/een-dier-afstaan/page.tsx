export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/queries/pages";
import ContentPage from "@/components/ui/ContentPage";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("een-dier-afstaan");
  return {
    title: page?.title || "Een dier afstaan",
    description: page?.metaDescription || "Informatie over het afstaan van een dier aan Dierenasiel Ninove.",
  };
}

export default async function EenDierAfstaanPage() {
  const page = await getPageBySlug("een-dier-afstaan");
  if (!page) notFound();
  return <ContentPage title={page.title} content={page.content} />;
}
