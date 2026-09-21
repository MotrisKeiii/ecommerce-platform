import { z } from "zod";

export const createProductImageSchema = z.object({
  isPrimary: z
    .string()
    .transform((value) => value === "true")
    .optional(),

  sortOrder: z.coerce.number().int().nonnegative().optional(),
});

export const updateProductImageSchema = createProductImageSchema.partial();
