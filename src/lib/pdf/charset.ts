/**
 * Onze PDF's gebruiken de ingebouwde Helvetica, en die kent enkel de
 * WinAnsi-tekenset: ASCII, Latin-1 (accenten, «», ½ …) en een handvol extra's
 * zoals €, ’, “ ”, – — en •. Van een teken daarbuiten houdt @react-pdf enkel de
 * laatste byte over — "✦" (U+2726) werd zo "&" op het adoptiecontract (story 10.65).
 *
 * Wil je iets tonen dat hier niet in zit (een vinkje, een pijl), teken het dan
 * met `Svg`, zoals het vinkje op de kennelkaart.
 */
const WIN_ANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

function isWinAnsi(teken: string): boolean {
  const code = teken.codePointAt(0)!;
  return code < 0x80 || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.includes(teken);
}

/** Geeft de tekens uit `text` die Helvetica niet kan tonen, elk één keer. */
export function unsupportedPdfChars(text: string): string[] {
  return [...new Set(Array.from(text).filter((teken) => !isWinAnsi(teken)))];
}
