import Link from "next/link";

export default function AdoptieAanvraagLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#d8f3dc] to-white">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-[#1b4332]">
            Adoptie-aanvraag
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Dierenasiel Ninove
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Fijn dat je een dier wil adopteren! Kies hieronder voor welk type dier
            je een aanvraag wil indienen.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <Link
            href="/adoptie-aanvraag/hond"
            className="group rounded-2xl border-2 border-[#52796f]/20 bg-white p-8 text-center shadow-sm transition hover:border-[#52796f] hover:shadow-md"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-4xl transition group-hover:bg-amber-100">
              🐕
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[#1b4332]">Hond</h2>
            <p className="mt-1 text-sm text-gray-500">
              Adoptieaanvraag voor een hond
            </p>
          </Link>

          <Link
            href="/adoptie-aanvraag/kat"
            className="group rounded-2xl border-2 border-[#52796f]/20 bg-white p-8 text-center shadow-sm transition hover:border-[#52796f] hover:shadow-md"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 text-4xl transition group-hover:bg-purple-100">
              🐈
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[#1b4332]">Kat / Kitten</h2>
            <p className="mt-1 text-sm text-gray-500">
              Adoptieaanvraag voor een kat of kitten
            </p>
          </Link>
        </div>

        <p className="mt-10 text-center text-xs text-gray-400">
          Na het indienen van je aanvraag neemt een medewerker zo snel mogelijk contact met je op.
        </p>
      </div>
    </div>
  );
}
