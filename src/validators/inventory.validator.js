import { z } from "zod";

export const createInventoryTransactionSchema = z.object({
  productVariantId: z.number().int().positive(),

  type: z.enum(["restock", "adjustment", "import"]),

  quantity: z.number().int().positive(),

  note: z.string().max(500).optional(),
});
