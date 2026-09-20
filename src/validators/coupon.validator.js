import { z } from "zod";

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(2, "Coupon code must be at least 2 characters")
    .max(50, "Coupon code is too long"),

  discountType: z.enum(["percentage", "fixed"]),

  discountValue: z.number().nonnegative("Discount value cannot be negative"),

  minOrderAmount: z
    .number()
    .nonnegative("Minimum order amount cannot be negative")
    .optional(),

  maxDiscountAmount: z
    .number()
    .nonnegative("Maximum discount amount cannot be negative")
    .nullable()
    .optional(),

  usageLimit: z.number().int().positive().nullable().optional(),

  startAt: z.string().datetime(),

  endAt: z.string().datetime(),

  status: z.enum(["active", "inactive"]).optional(),
});

export const updateCouponSchema = createCouponSchema.partial();

export const validateCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),

  orderAmount: z.number().nonnegative("Order amount cannot be negative"),
});