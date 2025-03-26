import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Param,
	Post,
} from "@nestjs/common";
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

const RefundRequestSchema = z.object({
	amount: z.number().positive(),
	id: z.string().uuid(),
});

const GetChargeRequestSchema = z.object({
	id: z.string().uuid(),
});

type CreateChargeRequest = z.infer<typeof CreateChargeRequestSchema>;

interface Charge {
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
	private readonly charges: Charge[] = [];

	@Post("charges")
	createCharge(@Body() body: CreateChargeRequest): Charge {
		const dto = CreateChargeRequestSchema.safeParse(body);
		if (!dto.success) throw new BadRequestException(dto.error);

		const status = simulateCardStatus(body.paymentMethod.card.number);
		const now = new Date();

		const charge: Charge = {
			id: uuidv4(),
			createdAt: now.toISOString().split("T")[0],
			status,
			originalAmount: body.amount,
			currentAmount: body.amount,
			currency: body.currency,
			description: body.description,
			paymentMethod: "card",
			cardId: uuidv4(),
		};
		this.charges.push(charge);
		return charge;
	}

	@Post("refund/:id")
	refund(
		@Body() body: { amount: number },
		@Param() param: { id: string },
	): Charge {
		const dto = RefundRequestSchema.safeParse({ ...body, ...param });
		if (!dto.success) throw new BadRequestException(dto.error);

		const charge = this.charges.find((c) => c.id === dto.data.id);
		if (!charge)
			throw new BadRequestException(`Charge with id ${dto.data.id} not found`);

		if (charge.status !== "authorized")
			throw new BadRequestException(
				`Charge with id ${dto.data.id} is not authorized`,
			);

		if (dto.data.amount > charge.currentAmount)
			throw new BadRequestException("Refund amount greater than charge amount");

		charge.status = "refunded";
		charge.currentAmount -= dto.data.amount;

		return charge;
	}

	@Get("charges/:id")
	getCharge(@Param() param: { id: string }): Charge {
		const dto = GetChargeRequestSchema.safeParse(param);
		if (!dto.success) throw new BadRequestException(dto.error);

		const charge = this.charges.find((c) => c.id === dto.data.id);
		if (!charge)
			throw new BadRequestException(`Charge with id ${dto.data.id} not found`);

		return charge;
	}
}
