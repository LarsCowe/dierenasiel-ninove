import { z } from "zod";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const uploadAttachmentSchema = z.object({
  animalId: z.coerce.number().positive("Ongeldig dier-ID"),
  fileType: z.string().refine(
    (type) => (ALLOWED_MIME_TYPES as readonly string[]).includes(type),
    "Ongeldig bestandstype. Toegestaan: afbeeldingen, video's en PDF.",
  ),
  fileName: z.string().min(1, "Bestandsnaam is verplicht"),
  description: z.string().optional(),
});

export type UploadAttachmentInput = z.infer<typeof uploadAttachmentSchema>;

export const deleteAttachmentSchema = z.object({
  id: z.coerce.number().positive("Ongeldig bijlage-ID"),
});

export type DeleteAttachmentInput = z.infer<typeof deleteAttachmentSchema>;
