import { z } from "zod";

export const RefundChargeSchema = z.object({
	chargeId: z.string().uuid(),
	amount: z.number().positive(),
});

export type RefundChargeDto = z.infer<typeof RefundChargeSchema>;
