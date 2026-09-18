import { z } from "zod";

export const createProductVariantSchema = z.object({
  productId: z.number().int().positive(),

  sku: z.string().min(2).max(100),

  price: z.number().nonnegative(),

  compareAtPrice: z.number().nonnegative().nullable().optional(),

  stock: z.number().int().nonnegative(),

  attributes: z.record(z.string(), z.any()).nullable().optional(),

  status: z.enum(["active", "inactive"]).optional(),
});

export const updateProductVariantSchema = createProductVariantSchema
  .omit({
    productId: true,
  })
  .partial();
