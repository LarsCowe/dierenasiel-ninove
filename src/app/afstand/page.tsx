import type { Metadata } from "next";
import SurrenderForm from "@/components/afstand/SurrenderForm";

export const metadata: Metadata = {
  title: "Afstand doen van een dier — Dierenasiel Ninove",
  description:
    "Formulier om afstand te doen van een hond, kat of ander dier bij Dierenasiel Ninove. Enkel op afspraak.",
};

export default function AfstandPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#d8f3dc] to-white px-4 py-8">
      <SurrenderForm />
    </div>
  );
}
