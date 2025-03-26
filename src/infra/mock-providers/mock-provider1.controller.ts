import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const CreateChargeRequestSchema = z.object({
	amount: z.number().positive(),
	currency: z.enum(["BRL"]),
	description: z.string(),
	paymentMethod: z.object({
		type: z.literal("card"),
		card: z.object({
			number: z.string(),
			holderName: z.string().min(3),
			cvv: z.string().length(3),
			expirationDate: z.string().regex(/^\d{2}\/\d{4}$/),
			installments: z.number().positive(),
		}),
	}),
});

type CreateChargeRequest = z.infer<typeof CreateChargeRequestSchema>;

interface ChargeResponse {
	id: string;
	createdAt: string;
	status: "authorized" | "failed" | "refunded";
	originalAmount: number;
	currentAmount: number;
	currency: string;
	description: string;
	paymentMethod: "card";
	cardId: string;
}

function simulateCardStatus(cardNumber: string): "authorized" | "failed" {
	const failureNumbers = ["4000000000000002"];
	return failureNumbers.includes(cardNumber) ? "failed" : "authorized";
}

@Controller("mock/provider1")
export class MockProvider1Controller {
	static readonly providerId = "mock-provider1-id";
	private readonly charges: ChargeResponse[] = [];

	@Post("charges")
	createCharge(@Body() body: CreateChargeRequest): ChargeResponse {
		const dto = CreateChargeRequestSchema.safeParse(body);
		if (!dto.success) throw new BadRequestException(dto.error);

		const status = simulateCardStatus(body.paymentMethod.card.number);
		const now = new Date();

		const charge: ChargeResponse = {
			id: MockProvider1Controller.providerId,
			createdAt: now.toISOString().split("T")[0],
			status,
			originalAmount: body.amount,
			currentAmount: body.amount,
			currency: body.currency,
			description: body.description,
			paymentMethod: "card",
			cardId: uuidv4(),
		};

		return charge;
	}
}
