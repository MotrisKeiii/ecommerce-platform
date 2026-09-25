import { z } from "zod";

// .strict(): từ chối field lạ. z.boolean() KHÔNG ép kiểu,
// nên chuỗi "false" sẽ bị từ chối thay vì bị coi là true.
export const mockPaymentSchema = z
  .object({
    success: z.boolean(),
  })
  .strict();
