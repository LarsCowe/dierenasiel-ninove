import IntakeForm from "@/components/beheerder/dieren/IntakeForm";

export default function IntakePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        Dier registreren
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Registreer een nieuw dier bij intake. Velden met * zijn verplicht.
      </p>

      <div className="mt-6">
        <IntakeForm />
      </div>
    </div>
  );
}
