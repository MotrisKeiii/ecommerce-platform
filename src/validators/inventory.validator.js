import { z } from "zod";

export const createInventoryTransactionSchema = z
  .object({
    productVariantId: z.number().int().positive(),

    type: z.enum(["restock", "adjustment", "import"]),

    quantity: z
      .number()
      .int()
      .refine((value) => value !== 0, "Quantity cannot be zero"),

    note: z.string().max(500).optional(),
  })
  .refine((data) => data.type === "adjustment" || data.quantity > 0, {
    path: ["quantity"],
    message: "Only adjustment may decrease stock",
  });
