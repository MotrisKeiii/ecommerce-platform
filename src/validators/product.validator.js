import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(200, "Product name is too long"),

  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(200, "Slug is too long"),

  description: z.string().optional(),

  brandId: z.number().int().positive(),

  categoryId: z.number().int().positive(),

  status: z.enum(["active", "inactive", "draft"]).optional(),
});

export const updateProductSchema = createProductSchema;
