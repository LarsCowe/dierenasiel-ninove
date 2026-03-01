"use server";

import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { getMailingRecipients, type MailingRecipientFilters } from "@/lib/queries/mailing";
import { sendEmail } from "@/lib/email/send";
import { logAudit } from "@/lib/audit";
import { db } from "@/lib/db";
import { mailingSends, mailingSendRecipients } from "@/lib/db/schema";
import { MAILING_TEMPLATES, SITE_NAME, CONTACT, SPECIES_LABELS } from "@/lib/constants";
import { followUpReminderHtml } from "@/lib/email/templates/follow-up-reminder";
import { generalInfoHtml } from "@/lib/email/templates/general-info";
import { revalidatePath } from "next/cache";
import type { ActionResult, MailingRecipient } from "@/types";
import type { MailingTemplateId } from "@/lib/constants";

export async function generateMailingList(
  filters: MailingRecipientFilters,
): Promise<ActionResult<MailingRecipient[]>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Je bent niet ingelogd." };
  }

  if (!hasPermission(session.role, "adoption:read")) {
    return { success: false, error: "Onvoldoende rechten." };
  }

  const validSpecies = Object.keys(SPECIES_LABELS);
  const sanitizedFilters = {
    ...filters,
    species: filters.species && validSpecies.includes(filters.species) ? filters.species : undefined,
  };

  const recipients = await getMailingRecipients(sanitizedFilters);
  return { success: true, data: recipients };
}

function generateHtml(
  templateName: MailingTemplateId,
  recipientName: string,
  animalName: string,
): string {
  switch (templateName) {
    case "follow_up_1_week":
      return followUpReminderHtml({
        recipientName,
        animalName,
        shelterName: SITE_NAME,
        period: "1_week",
      });
    case "follow_up_1_month":
      return followUpReminderHtml({
        recipientName,
        animalName,
        shelterName: SITE_NAME,
        period: "1_month",
      });
    case "general_info":
      return generalInfoHtml({
        recipientName,
        shelterName: SITE_NAME,
        messageBody: "We hebben nieuws en updates voor u van het dierenasiel.",
      });
    default:
      return followUpReminderHtml({
        recipientName,
        animalName,
        shelterName: SITE_NAME,
        period: "1_week",
      });
  }
}

interface SendMailingParams {
  recipients: MailingRecipient[];
  subject: string;
  templateName: MailingTemplateId;
}

export async function sendMailingAction(
  params: SendMailingParams,
): Promise<ActionResult<{ sentCount: number; failedCount: number }>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Je bent niet ingelogd." };
  }

  if (!hasPermission(session.role, "adoption:write")) {
    return { success: false, error: "Onvoldoende rechten om mails te versturen." };
  }

  if (params.recipients.length === 0) {
    return { success: false, error: "Geen ontvangers geselecteerd." };
  }

  if (!params.subject.trim()) {
    return { success: false, error: "Onderwerp is verplicht." };
  }

  const validTemplates = MAILING_TEMPLATES.map((t) => t.id);
  if (!validTemplates.includes(params.templateName)) {
    return { success: false, error: "Ongeldig email template." };
  }

  const fromEmail = CONTACT.emailDogs;

  try {
    // Create mailing send record
    const [send] = await db
      .insert(mailingSends)
      .values({
        subject: params.subject,
        templateName: params.templateName,
        fromEmail,
        recipientCount: params.recipients.length,
        sentBy: session.userId,
      })
      .returning();

    let sentCount = 0;
    let failedCount = 0;

    // Send emails sequentially (Resend free tier, no batch needed)
    for (const recipient of params.recipients) {
      const recipientName = `${recipient.firstName} ${recipient.lastName}`;
      const html = generateHtml(params.templateName, recipientName, recipient.animalName);

      const result = await sendEmail({
        to: recipient.email,
        from: fromEmail,
        subject: params.subject,
        html,
      });

      const status = result.success ? "sent" : "failed";
      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
      }

      // Log each recipient
      await db.insert(mailingSendRecipients).values({
        sendId: send.id,
        email: recipient.email,
        recipientName,
        animalName: recipient.animalName,
        status,
        sentAt: result.success ? new Date() : null,
      });
    }

    await logAudit("mailing.sent", "mailing_send", send.id, null, {
      recipientCount: params.recipients.length,
      templateName: params.templateName,
      sentCount,
      failedCount,
    });

    revalidatePath("/beheerder/mailing");

    return {
      success: true,
      data: { sentCount, failedCount },
      message: `${sentCount} mail(s) verstuurd${failedCount > 0 ? `, ${failedCount} mislukt` : ""}.`,
    };
  } catch (err) {
    console.error("sendMailingAction failed:", err);
    return { success: false, error: "Er ging iets mis bij het versturen van de mailing." };
  }
}
