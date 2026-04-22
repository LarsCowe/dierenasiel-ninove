const PUBLIC_FORM_LINKS: { label: string; href: string }[] = [
  { label: "Hond", href: "/adoptie-aanvraag/hond" },
  { label: "Kat", href: "/adoptie-aanvraag/kat" },
  { label: "Andere", href: "/adoptie-aanvraag/andere" },
];

export default function NieuweAdoptieAanvraagPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
        Nieuwe adoptie-aanvraag
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Gebruik het publieke aanvraagformulier — dat bevat alle verplichte velden
        (vragenlijst Bijlage IX, contact, gewenst dier). De aanvraag verschijnt
        automatisch in het adoptie-overzicht na submit.
      </p>

      <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
        <h2 className="text-sm font-semibold text-[#1b4332]">
          Welk dier betreft het?
        </h2>
        <p className="mt-1 text-xs text-gray-600">
          Kies de diersoort en het formulier opent in een nieuw tabblad. Handig
          wanneer je een aanvraag inneemt aan de balie of telefonisch.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PUBLIC_FORM_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
            >
              Formulier — {link.label}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3 w-3"
                aria-hidden="true"
              >
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
