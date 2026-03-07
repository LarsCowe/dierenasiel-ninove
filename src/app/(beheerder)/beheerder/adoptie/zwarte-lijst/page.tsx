import Link from "next/link";
import { getAllBlacklistEntries } from "@/lib/queries/blacklist";
import BlacklistManager from "@/components/beheerder/adoptie/BlacklistManager";

export default async function ZwarteLijstPage() {
  const entries = await getAllBlacklistEntries();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1b4332]">
            Zwarte lijst
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Personen die uitgesloten zijn van adoptie. Nieuwe kandidaturen worden automatisch
            getoetst aan deze lijst.
          </p>
        </div>
        <Link
          href="/beheerder/adoptie"
          className="rounded-md border border-emerald-700 px-5 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
        >
          Terug naar aanvragen
        </Link>
      </div>

      <div className="mt-6">
        <BlacklistManager entries={entries} />
      </div>
    </div>
  );
}
