import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAnimalBySlug } from "@/lib/queries/animals";
import AnimalProfile from "@/components/animals/AnimalProfile";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const animal = await getAnimalBySlug(slug);
  if (!animal) return {};
  return {
    title: `${animal.name} ter adoptie`,
    description: animal.shortDescription || `Maak kennis met ${animal.name} bij Dierenasiel Ninove.`,
    openGraph: {
      images: animal.imageUrl ? [{ url: animal.imageUrl }] : [],
    },
  };
}

export default async function AnderDierDetailPage({ params }: Props) {
  const { slug } = await params;
  const animal = await getAnimalBySlug(slug);
  if (!animal || animal.species === "hond" || animal.species === "kat") notFound();
  return <AnimalProfile animal={animal} />;
}
