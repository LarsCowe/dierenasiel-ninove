import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import OwnerReturnPdf from "@/components/beheerder/dieren/OwnerReturnPdf";
import { buildOwnerReturnPdfData, type OwnerReturnRecordLike } from "./owner-return";

/**
 * Story 10.64 — het document dat als bijlage in de mail naar de eigenaar gaat.
 * De getekende versie (scan op Vercel Blob) als die er is, anders de PDF zoals
 * de afdrukknop ze maakt.
 */

export interface OwnerReturnAttachment {
  filename: string;
  content: Buffer;
  /** Is dit de getekende scan (true) of het blanco ingevulde formulier (false)? */
  signed: boolean;
}

export function ownerReturnPdfFilename(formNr: string): string {
  return `terug-naar-eigenaar-${formNr}.pdf`;
}

/** De extensie van de scan, zodat een foto als foto aankomt en niet als ".pdf". */
function extensieVan(url: string): string {
  const m = url.split("?")[0].match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : "pdf";
}

export async function renderOwnerReturnPdf(form: OwnerReturnRecordLike): Promise<Buffer> {
  // Zelfde cast als de kennelkaart-route: @react-pdf typeert renderToBuffer op <Document>,
  // terwijl ons component dat Document zelf teruggeeft.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(createElement(OwnerReturnPdf, { data: buildOwnerReturnPdfData(form) }) as any);
}

export async function buildOwnerReturnAttachment(
  form: OwnerReturnRecordLike & { signedDocumentUrl: string | null },
): Promise<OwnerReturnAttachment> {
  if (form.signedDocumentUrl) {
    const res = await fetch(form.signedDocumentUrl);
    if (!res.ok) throw new Error(`Getekende versie niet op te halen (${res.status})`);
    const content = Buffer.from(await res.arrayBuffer());
    return {
      filename: `terug-naar-eigenaar-${form.formNr}-getekend.${extensieVan(form.signedDocumentUrl)}`,
      content,
      signed: true,
    };
  }
  return {
    filename: ownerReturnPdfFilename(form.formNr),
    content: await renderOwnerReturnPdf(form),
    signed: false,
  };
}
