import { z } from "zod";

export const createAddressSchema = z.object({
  recipientName: z
    .string()
    .min(2, "Recipient name must be at least 2 characters")
    .max(100),

  phone: z.string().min(9, "Invalid phone number").max(20),

  province: z.string().min(2).max(100),

  district: z.string().min(2).max(100),

  ward: z.string().min(2).max(100),

  addressLine: z.string().min(5).max(255),

  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();
