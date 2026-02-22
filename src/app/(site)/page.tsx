export const dynamic = "force-dynamic";

import HeroSection from "@/components/home/HeroSection";
import AboutPreview from "@/components/home/AboutPreview";
import FeaturedAnimals from "@/components/home/FeaturedAnimals";
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
      <CtaBanner />
      <NewsPreview />
      <ContactSection />
    </>
  );
}
