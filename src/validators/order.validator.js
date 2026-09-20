import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.number().int().positive(),
  paymentMethod: z.enum(["cod", "mock", "momo", "vnpay"]),
  couponCode: z.string().optional(),
  note: z.string().max(1000).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipping",
    "delivered",
    "cancelled",
    "returned",
  ]),
});