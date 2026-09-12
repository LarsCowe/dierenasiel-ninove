import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { getAnimalById } from "@/lib/queries/animals";
import { getOwnerReturnForm } from "@/lib/queries/owner-return";
import { buildOwnerReturnPdfData, ownerFullName } from "@/lib/animals/owner-return";
import SignedDocumentUpload from "@/components/beheerder/adoptie/SignedDocumentUpload";
import OwnerReturnEmailButton from "@/components/beheerder/dieren/OwnerReturnEmailButton";

interface Props {
  params: Promise<{ id: string; formId: string }>;
}

function Veld({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value || "—"}</dd>
    </div>
  );
}

const jaNee = (ja: boolean, nee: boolean) => (ja ? "Ja" : nee ? "Nee" : "");

/** Story 10.64 — één formulier "Terug naar eigenaar": afdrukken, tekenen, bewaren, mailen. */
export default async function TerugNaarEigenaarDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session || !hasPermission(session.role, "animal:read")) redirect("/beheerder");
  const magSchrijven = hasPermission(session.role, "animal:write");

  const { id, formId } = await params;
  const animalId = Number(id);
  const formulierId = Number(formId);
  if (isNaN(animalId) || isNaN(formulierId)) notFound();

  const [animal, form] = await Promise.all([getAnimalById(animalId), getOwnerReturnForm(animalId, formulierId)]);
  if (!animal || !form) notFound();

  const d = buildOwnerReturnPdfData(form);
  const api = `/api/dieren/${animalId}/terug-naar-eigenaar/${form.id}`;
  const adres = [d.ownerStreet, [d.ownerPostalCode, d.ownerCity].filter(Boolean).join(" "), d.ownerCountry]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/beheerder/dieren/${animalId}`} className="text-sm text-[#2d6a4f] hover:underline">
          ← Terug naar {animal.name}
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#1b4332]">Terug naar eigenaar — {d.formNr}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {ownerFullName(form)} haalt {form.animalName} op · opgemaakt op {d.drawnUpOn}
              {d.drawnUpAt ? ` te ${d.drawnUpAt}` : ""}
            </p>
          </div>
          {form.signedDocumentUrl ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Getekend</span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">Nog niet getekend</span>
          )}
        </div>
      </div>

      {animal.isInShelter && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {animal.name} staat nog als aanwezig in het asiel. Vergeet de uitstroom niet te registreren op de{" "}
          <Link href={`/beheerder/dieren/${animalId}`} className="font-medium underline">
            fiche
          </Link>{" "}
          (reden: terug naar eigenaar).
        </p>
      )}

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Afdrukken, tekenen, bewaren</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={`${api}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-[#1b4332] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2d6a4f]"
          >
            Afdrukken (PDF)
          </a>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Laat de eigenaar en de afgevaardigde van het asiel tekenen, scan of fotografeer het blad en laad het hier op.
        </p>

        <div className="mt-5 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-700">Getekende versie</h3>
          {form.signedDocumentUrl ? (
            <div className="mt-2 flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
              <span className="text-xs text-emerald-800">
                Opgeladen op {form.signedAt ? new Date(form.signedAt).toLocaleString("nl-BE") : "—"}
              </span>
              <a
                href={form.signedDocumentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-emerald-800 underline hover:text-emerald-900"
              >
                Bekijken
              </a>
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-500">Nog geen getekende versie opgeladen.</p>
          )}
          {magSchrijven && (
            <SignedDocumentUpload uploadUrl={`${api}/signed-upload`} hasExisting={Boolean(form.signedDocumentUrl)} />
          )}
        </div>

        <div className="mt-5 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-700">Kopie voor de eigenaar</h3>
          {form.copyEmailedAt && (
            <p className="mt-1 text-xs text-emerald-800">
              Gemaild naar {form.copyEmailedTo} op {new Date(form.copyEmailedAt).toLocaleString("nl-BE")}.
            </p>
          )}
          <div className="mt-2">
            {magSchrijven ? (
              <OwnerReturnEmailButton
                animalId={animalId}
                formId={form.id}
                ownerEmail={form.ownerEmail}
                hasSigned={Boolean(form.signedDocumentUrl)}
              />
            ) : (
              <p className="text-xs text-gray-500">Enkel wie dieren mag bewerken, kan de kopie mailen.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Eigenaar</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <Veld label="Naam" value={ownerFullName(form)} />
          <Veld label="Adres" value={adres} />
          <Veld label="Geboortedatum" value={d.ownerBirthDate} />
          <Veld label="Geboorteplaats" value={d.ownerBirthPlace} />
          <Veld label="Telefoon" value={d.ownerPhone} />
          <Veld label="Gsm" value={d.ownerMobile} />
          <Veld label="E-mail" value={d.ownerEmail} />
        </dl>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Gegevens van het dier (momentopname)</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <Veld label="Naam" value={d.animalName} />
          <Veld label="Diersoort" value={d.speciesLabel} />
          <Veld label="Ras" value={d.animalBreed} />
          <Veld label="Geboortedatum" value={d.animalBirthDate} />
          <Veld label="Identificatienr" value={d.animalIdentificationNr} />
          <Veld label="Geslacht" value={d.genderM ? "M" : d.genderV ? "V" : ""} />
          <Veld label="Gesteriliseerd" value={jaNee(d.neuteredYes, d.neuteredNo)} />
          <Veld label="Stamboom" value={jaNee(d.pedigreeYes, d.pedigreeNo)} />
          <Veld label="Nr paspoort / vaccinatieboekje" value={d.animalPassportNr} />
          <div className="sm:col-span-2">
            <Veld label="Beschrijving vacht en bijzondere kenmerken" value={d.animalCoatDescription} />
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading text-sm font-bold text-[#1b4332]">Bijdrage in de kosten</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <Veld label="Verblijfskosten" value={d.stayCosts} />
          <Veld label="Totaal betaald bedrag" value={d.totalPaid ? `€ ${d.totalPaid}` : ""} />
        </dl>
      </div>

    </div>
  );
}
