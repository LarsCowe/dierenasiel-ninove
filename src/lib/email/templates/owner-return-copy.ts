import { escapeHtml } from "./layout";
import { CONTACT, SITE_NAME } from "@/lib/constants";

/**
 * Story 10.64 — de kopie van het formulier "Terug naar eigenaar" voor de
 * eigenaar. Geen knop of link: het formulier zit als bijlage in de mail, want
 * de eigenaar heeft geen login en een publieke link naar een document met naam
 * en adres hoort niet in een mail.
 */

interface OwnerReturnCopyParams {
  ownerName: string;
  animalName: string;
  formNr: string;
  /** Al in Belgische notatie (DD/MM/JJJJ). */
  drawnUpOn: string;
  /** Zit de getekende versie in bijlage, of het blanco ingevulde formulier? */
  signed: boolean;
}

export interface OwnerReturnCopyEmail {
  subject: string;
  html: string;
  text: string;
}

export function ownerReturnCopyEmail(p: OwnerReturnCopyParams): OwnerReturnCopyEmail {
  const bijlage = p.signed
    ? "In bijlage vindt u de getekende versie van het formulier."
    : "In bijlage vindt u het ingevulde formulier.";

  const alineas = [
    `${p.animalName} is op ${p.drawnUpOn} terug naar huis gegaan. ${bijlage}`,
    `Bewaar dit document: het is uw bewijs dat u ${p.animalName} bij ${SITE_NAME} hebt opgehaald (formulier ${p.formNr}).`,
    `Vragen? Bel ${CONTACT.phone} of mail naar ${CONTACT.emailGeneral}.`,
  ];

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1b4332;">Beste ${escapeHtml(p.ownerName)},</h2>
${alineas.map((a) => `  <p style="line-height: 1.6;">${escapeHtml(a)}</p>`).join("\n")}
  <p>Met vriendelijke groeten,<br><strong>${escapeHtml(SITE_NAME)}</strong></p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 20px;">
  <p style="font-size: 12px; color: #9ca3af;">${escapeHtml(SITE_NAME)} · ${escapeHtml(CONTACT.phone)} · ${escapeHtml(CONTACT.website)}</p>
</body>
</html>`;

  const text = [`Beste ${p.ownerName},`, "", ...alineas.flatMap((a) => [a, ""]), "Met vriendelijke groeten,", SITE_NAME].join("\n");

  return {
    subject: `${p.animalName} terug naar huis — formulier ${p.formNr}`,
    html,
    text,
  };
}
