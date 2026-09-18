import { z } from "zod";

export const createProductImageSchema = z.object({
  imageUrl: z.string().url("Invalid image URL"),

  isPrimary: z.boolean().optional(),

  sortOrder: z.number().int().nonnegative().optional(),
});

export const updateProductImageSchema = createProductImageSchema.partial();
