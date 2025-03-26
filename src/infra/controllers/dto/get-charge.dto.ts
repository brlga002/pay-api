import { z } from "zod";

export const GetChargeSchema = z.object({
	chargeId: z.string().uuid(),
});

export type GetChargeDto = z.infer<typeof GetChargeSchema>;
