export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/queries/pages";
import ContentPage from "@/components/ui/ContentPage";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("steun-ons");
  return {
    title: page?.title || "Steun ons",
    description: page?.metaDescription || "Steun Dierenasiel Ninove met een donatie, sponsoring of via Trooper.",
  };
}

export default async function SteunOnsPage() {
  const page = await getPageBySlug("steun-ons");
  if (!page) notFound();
  return <ContentPage title={page.title} content={page.content} />;
}
