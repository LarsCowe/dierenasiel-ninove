import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getMailingSendRecipients } from "@/lib/queries/mailing";

export async function GET(request: NextRequest) {
  const permCheck = await requirePermission("adoption:read");
  if (permCheck && !permCheck.success) {
    return NextResponse.json([], { status: 403 });
  }

  const sendIdParam = request.nextUrl.searchParams.get("sendId");
  if (!sendIdParam) {
    return NextResponse.json([], { status: 400 });
  }

  const sendId = parseInt(sendIdParam, 10);
  if (isNaN(sendId) || sendId <= 0) {
    return NextResponse.json([], { status: 400 });
  }

  const recipients = await getMailingSendRecipients(sendId);
  return NextResponse.json(recipients);
}
