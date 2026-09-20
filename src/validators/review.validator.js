import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.number().int().positive(),

  orderItemId: z.number().int().positive(),

  rating: z.number().int().min(1).max(5),

  comment: z.string().max(1000).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),

  comment: z.string().max(1000).optional(),
});

export const updateReviewStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});