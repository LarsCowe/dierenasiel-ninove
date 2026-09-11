import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { getSuppliers, getSupplierUsage } from "@/lib/queries/suppliers";
import { eventCountBySupplier, supplierKey } from "@/lib/events/suppliers";
import InfoButton from "@/components/beheerder/shared/InfoButton";
import SuppliersManager from "@/components/beheerder/evenementen/SuppliersManager";

/**
 * Story 13.16 — de leveranciers van de evenementen, met hun gsm, mail en website.
 * Sven (13 aug 2026): "meer gegevens kunnen invullen van de leverancier".
 */
export default async function LeveranciersPage() {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "event:read")) redirect("/beheerder");

  const [lijst, gebruik] = await Promise.all([getSuppliers(), getSupplierUsage()]);
  const telling = eventCountBySupplier(gebruik);
  const metTelling = lijst.map((s) => ({ ...s, eventCount: telling.get(supplierKey(s.name)) ?? 0 }));

  return (
    <div className="space-y-6">
      <Link href="/beheerder/evenementen" className="text-sm text-[#2d6a4f] hover:underline">
        ← Terug naar evenementen
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-heading text-2xl font-bold text-[#1b4332]">Leveranciers</h1>
        <InfoButton title="Werken met de leverancierslijst" label="Uitleg over de leverancierslijst">
          <p>
            Bij wie bestellen of huren we iets voor een evenement? Vul hier één keer het gsm-nummer,
            het e-mailadres en de website in. Ze verschijnen dan onder elke kost en elk materiaal van
            die leverancier, op elke evenementfiche.
          </p>
          <p className="mt-2">
            Een naam die je bij een kost of bij materiaal typt, komt hier vanzelf bij. Wijzig je hier
            de naam, dan past die zich overal mee aan. Verwijder je een leverancier, dan blijven de
            regels staan met hun naam; enkel de contactgegevens verdwijnen.
          </p>
        </InfoButton>
      </div>

      <SuppliersManager suppliers={metTelling} canWrite={hasPermission(session.role, "event:write")} />
    </div>
  );
}
