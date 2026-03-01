interface GeneralInfoParams {
  recipientName: string;
  shelterName: string;
  messageBody: string;
}

export function generalInfoHtml(params: GeneralInfoParams): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1b4332;">Hallo ${params.recipientName},</h2>
  <p>${params.messageBody}</p>
  <p>Met vriendelijke groeten,<br><strong>${params.shelterName}</strong></p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 20px;">
  <p style="font-size: 12px; color: #9ca3af;">Dit is een automatisch bericht van ${params.shelterName}.</p>
</body>
</html>`;
}
