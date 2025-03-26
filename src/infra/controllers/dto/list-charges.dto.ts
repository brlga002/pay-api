import { z } from "zod";

export const ListChargeSchema = z.object({
	merchantId: z.string().min(1).optional(),
	orderId: z.string().min(1).optional(),
	page: z.coerce.number().positive().default(1),
	limit: z.coerce.number().int().min(1).max(100).default(5),
	sort: z
		.enum(["asc", "desc", "ASC", "DESC"])
		.default("asc")
		.transform((v) => v.toLowerCase() as "asc" | "desc"),
});

export type ListChargeDto = z.infer<typeof ListChargeSchema>;
