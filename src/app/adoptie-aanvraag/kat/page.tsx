import PublicAdoptionForm from "@/components/adoptie/PublicAdoptionForm";

export default function KatAdoptieAanvraagPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#d8f3dc] to-white px-4 py-8">
      <PublicAdoptionForm species="kat" />
    </div>
  );
}
