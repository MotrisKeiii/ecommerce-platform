import { z } from "zod";

export const checkoutSchema = z.object({
  addressId: z.number().int().positive(),

  paymentMethod: z.enum(["cod", "mock", "momo", "vnpay"]),

  couponCode: z.string().min(1).optional(),

  note: z.string().max(500).optional(),
});
