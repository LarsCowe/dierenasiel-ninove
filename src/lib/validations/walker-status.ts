import { z } from "zod";

export const walkerStatusUpdateSchema = z
  .object({
    status: z.enum(["approved", "rejected", "inactive"], {
      error: "Ongeldige status",
    }),
    rejectionReason: z.string().optional().default(""),
  })
  .refine(
    (data) => {
      if (data.status === "rejected") {
        return data.rejectionReason.trim().length > 0;
      }
      return true;
    },
    {
      message: "Geef een reden op bij afwijzing",
      path: ["rejectionReason"],
    },
  );

export type WalkerStatusUpdateInput = z.infer<typeof walkerStatusUpdateSchema>;
