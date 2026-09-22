import { z } from "zod";

export const createProductImageSchema = z.object({
  isPrimary: z.preprocess((value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  }, z.boolean().optional()),

  sortOrder: z.coerce.number().int().nonnegative().optional(),
});

export const updateProductImageSchema = z.object({
  isPrimary: z.preprocess((value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  }, z.boolean().optional()),

  sortOrder: z.coerce.number().int().nonnegative().optional(),
});
