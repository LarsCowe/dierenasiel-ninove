import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/validations/attachments";
import { NextResponse } from "next/server";

/**
 * POST /api/upload/client
 *
 * Handles Vercel Blob client-upload token generation.
 * The file is uploaded directly from the browser to Vercel Blob,
 * bypassing the serverless function body-size limit.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const session = await getSession();
        if (!session) throw new Error("Niet ingelogd");

        const meta = JSON.parse(clientPayload || "{}");
        const context = meta.context || "dossier";
        const requiredPermission =
          context === "verwaarlozing"
            ? "medical:write"
            : context === "post_adoptie"
              ? "adoption:write"
              : "animal:write";

        if (!hasPermission(session.role, requiredPermission)) {
          throw new Error("Onvoldoende rechten");
        }

        return {
          allowedContentTypes: [...ALLOWED_MIME_TYPES],
          maximumSizeInBytes: MAX_FILE_SIZE,
          tokenPayload: clientPayload || "{}",
        };
      },
      onUploadCompleted: async () => {
        // DB insert is handled client-side via /api/upload/record
        // because onUploadCompleted does not fire in development.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload token mislukt";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
