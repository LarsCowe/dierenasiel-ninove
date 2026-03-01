"use server";

import { generateMailingList, sendMailingAction } from "@/lib/actions/mailing";
import type { MailingRecipientFilters } from "@/lib/queries/mailing";
import type { MailingRecipient } from "@/types";
import type { MailingTemplateId } from "@/lib/constants";

export async function generateMailingListWrapper(filters: MailingRecipientFilters) {
  return generateMailingList(filters);
}

export async function sendMailingActionWrapper(params: {
  recipients: MailingRecipient[];
  subject: string;
  templateName: MailingTemplateId;
}) {
  return sendMailingAction(params);
}
