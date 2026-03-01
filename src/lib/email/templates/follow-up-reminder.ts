interface FollowUpReminderParams {
  recipientName: string;
  animalName: string;
  shelterName: string;
  period: "1_week" | "1_month";
}

export function followUpReminderHtml(params: FollowUpReminderParams): string {
  const periodText = params.period === "1_week"
    ? "Het is nu ongeveer een week geleden dat u"
    : "Het is nu ongeveer een maand geleden dat u";

  const callToAction = params.period === "1_week"
    ? "Graag horen we hoe de eerste dagen verlopen zijn. Heeft u vragen over voeding, gedrag of verzorging? Aarzel niet om ons te contacteren."
    : "Graag horen we hoe het gaat met uw huisgenoot. Is alles goed ingeburgerd? Heeft u vragen of opmerkingen? Aarzel niet om ons te contacteren.";

  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1b4332;">Hallo ${params.recipientName},</h2>
  <p>${periodText} <strong>${params.animalName}</strong> heeft geadopteerd. We hopen dat het goed gaat!</p>
  <p>${callToAction}</p>
  <p>Met vriendelijke groeten,<br><strong>${params.shelterName}</strong></p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 20px;">
  <p style="font-size: 12px; color: #9ca3af;">Dit is een automatisch bericht van ${params.shelterName}.</p>
</body>
</html>`;
}
