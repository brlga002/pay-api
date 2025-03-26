import { z } from "zod";

const CardSchema = z.object({
	number: z.string().min(13).max(19),
	holderName: z.string().min(1),
	cvv: z.string().min(3).max(4),
	expirationDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{4}$/),
});

const PaymentMethod = z.object({
	type: z.literal("credit"),
	installments: z.number().int().min(1),
	card: CardSchema,
});

export const CreateChargeSchema = z.object({
	merchantId: z.string().min(1),
	orderId: z.string().min(1),
	amount: z.number().positive(),
	currency: z.enum(["BRL"]),
	description: z.string(),
	paymentMethod: PaymentMethod,
});

export type CreateChargeDto = z.infer<typeof CreateChargeSchema>;
