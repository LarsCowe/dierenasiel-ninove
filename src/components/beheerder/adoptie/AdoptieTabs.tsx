import Link from "next/link";

interface Props {
  active: "aanvragen" | "contracten";
}

export default function AdoptieTabs({ active }: Props) {
  return (
    <div className="border-b border-gray-200">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <nav className="-mb-px flex gap-6">
          <Tab href="/beheerder/adoptie?tab=aanvragen" active={active === "aanvragen"}>
            Adoptie-aanvragen
          </Tab>
          <Tab href="/beheerder/adoptie?tab=contracten" active={active === "contracten"}>
            Adoptie-contracten
          </Tab>
        </nav>

        <div className="mb-2 flex flex-wrap gap-2">
          <Link
            href="/beheerder/adoptie/zwarte-lijst"
            className="rounded-md border border-red-600 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Zwarte lijst
          </Link>
          <Link
            href="/beheerder/adoptie/opvolging"
            className="rounded-md border border-emerald-700 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Opvolgingen
          </Link>
          {active === "aanvragen" ? (
            <Link
              href="/beheerder/adoptie/nieuw"
              className="rounded-md bg-[#1b4332] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2d6a4f]"
            >
              Nieuwe aanvraag
            </Link>
          ) : (
            <Link
              href="/beheerder/adoptie/contracten/nieuw"
              className="rounded-md bg-[#1b4332] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2d6a4f]"
            >
              Nieuw contract
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Tab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium ${
        active
          ? "border-emerald-700 text-emerald-800"
          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
      }`}
    >
      {children}
    </Link>
  );
}
