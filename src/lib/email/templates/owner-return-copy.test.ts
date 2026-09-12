import { describe, it, expect } from "vitest";
import { ownerReturnCopyEmail } from "./owner-return-copy";

/** Story 10.64 — de kopie van het formulier "Terug naar eigenaar" voor de eigenaar. */

describe("ownerReturnCopyEmail", () => {
  const mail = ownerReturnCopyEmail({
    ownerName: "Peeters An",
    animalName: "Bo",
    formNr: "TNE-2026-0003",
    drawnUpOn: "12/09/2026",
    signed: true,
  });

  it("noemt dier en volgnummer in het onderwerp", () => {
    expect(mail.subject).toBe("Bo terug naar huis — formulier TNE-2026-0003");
  });

  it("spreekt de eigenaar aan en zegt dat de getekende versie in bijlage zit", () => {
    expect(mail.html).toContain("Peeters An");
    expect(mail.html).toContain("getekende");
    expect(mail.text).toContain("Peeters An");
    expect(mail.text).toContain("getekende");
    expect(mail.text).toContain("12/09/2026");
  });

  it("zegt het anders wanneer er nog geen getekende versie is", () => {
    const blanco = ownerReturnCopyEmail({ ownerName: "Peeters An", animalName: "Bo", formNr: "TNE-2026-0003", drawnUpOn: "12/09/2026", signed: false });
    expect(blanco.html).not.toContain("getekende");
    expect(blanco.text).toContain("het ingevulde formulier");
  });

  it("ontsnapt HTML in de naam", () => {
    const m = ownerReturnCopyEmail({ ownerName: "<b>x</b>", animalName: "Bo", formNr: "TNE-2026-0001", drawnUpOn: "01/01/2026", signed: false });
    expect(m.html).not.toContain("<b>x</b>");
    expect(m.html).toContain("&lt;b&gt;x&lt;/b&gt;");
  });
});
