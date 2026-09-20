import { z } from "zod";

export const createPaymentSchema = z.object({
  orderId: z.number().int().positive(),

  provider: z.enum(["cod", "mock", "momo", "vnpay"]),
});
