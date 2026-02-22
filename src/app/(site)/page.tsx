export const dynamic = "force-dynamic";

import HeroSection from "@/components/home/HeroSection";
import AboutPreview from "@/components/home/AboutPreview";
import FeaturedAnimals from "@/components/home/FeaturedAnimals";
import PetersMeters from "@/components/home/PetersMeters";
import SponsorsPreview from "@/components/home/SponsorsPreview";
import AdoptionProcess from "@/components/home/AdoptionProcess";
import CtaBanner from "@/components/home/CtaBanner";
import NewsPreview from "@/components/home/NewsPreview";
import ContactSection from "@/components/home/ContactSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutPreview />
      <FeaturedAnimals />
      <AdoptionProcess />
      <PetersMeters />
      <SponsorsPreview />
      <CtaBanner />
      <NewsPreview />
      <ContactSection />
    </>
  );
}
