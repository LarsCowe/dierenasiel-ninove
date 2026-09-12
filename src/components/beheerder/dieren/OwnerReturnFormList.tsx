import Link from "next/link";
import type { OwnerReturnFormRow } from "@/lib/queries/owner-return";
import { formatBelgianDate, ownerFullName } from "@/lib/animals/owner-return";

interface Props {
  animalId: number;
  forms: OwnerReturnFormRow[];
  canCreate: boolean;
}

/**
 * Story 10.64 — knop + lijst onder "Uitstroom" op de fiche: het formulier is het
 * bewijs dat het dier naar zijn eigenaar terugging, en dat moet je later bij het
 * dier terugvinden.
 */
export default function OwnerReturnFormList({ animalId, forms, canCreate }: Props) {
  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      {canCreate && (
        <Link
          href={`/beheerder/dieren/${animalId}/terug-naar-eigenaar/nieuw`}
          className="inline-block rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Formulier terug naar eigenaar
        </Link>
      )}
      {forms.length > 0 && (
        <ul className="mt-2 space-y-1">
          {forms.map((f) => (
            <li key={f.id} className="text-xs text-gray-700">
              <Link
                href={`/beheerder/dieren/${animalId}/terug-naar-eigenaar/${f.id}`}
                className="font-medium text-[#2d6a4f] hover:underline"
              >
                {f.formNr}
              </Link>{" "}
              · {formatBelgianDate(f.drawnUpOn)} · {ownerFullName(f)}
              {f.signedDocumentUrl ? " · getekend" : " · nog niet getekend"}
              {f.copyEmailedAt ? " · gemaild" : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
