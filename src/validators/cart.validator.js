import { z } from "zod";

export const addToCartSchema = z.object({
  productVariantId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});
