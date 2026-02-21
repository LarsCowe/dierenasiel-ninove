export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/queries/pages";
import ContentPage from "@/components/ui/ContentPage";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("eetfestijn");
  return {
    title: page?.title || "Eetfestijn",
    description: page?.metaDescription || "Het jaarlijkse eetfestijn van Dierenasiel Ninove.",
  };
}

export default async function EetfestijnPage() {
  const page = await getPageBySlug("eetfestijn");
  if (!page) notFound();
  return <ContentPage title={page.title} content={page.content} />;
}
