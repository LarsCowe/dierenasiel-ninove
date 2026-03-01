import { resend } from "./index";

interface SendEmailParams {
  to: string;
  from: string;
  subject: string;
  html: string;
}

export async function sendEmail(
  params: SendEmailParams,
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: "Email service niet geconfigureerd (RESEND_API_KEY ontbreekt)." };
  }

  try {
    await resend.emails.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      html: params.html,
    });
    return { success: true };
  } catch (err) {
    console.error("Email send failed:", err);
    return { success: false, error: String(err) };
  }
}
