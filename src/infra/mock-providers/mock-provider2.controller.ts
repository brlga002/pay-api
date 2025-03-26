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

const CreateTransactionRequestSchema = z.object({
	amount: z.number().positive(),
	currency: z.enum(["BRL"]),
	statementDescriptor: z.string(),
	paymentType: z.literal("card"),
	card: z.object({
		number: z.string(),
		holder: z.string().min(3),
		cvv: z.string().length(3),
		expiration: z.string().regex(/^\d{2}\/\d{2}$/),
		installmentNumber: z.number().positive(),
	}),
});

interface CreateTransactionRequest {
	amount: number;
	currency: string;
	statementDescriptor: string;
	paymentType: "card";
	card: {
		number: string;
		holder: string;
		cvv: string;
		expiration: string;
		installmentNumber: number;
	};
}

export interface TransactionResponse {
	id: string;
	date: string;
	status: "paid" | "failed" | "voided";
	amount: number;
	originalAmount: number;
	currency: string;
	statementDescriptor: string;
	paymentType: "card";
	cardId: string;
}

const RefundRequestSchema = z.object({
	amount: z.number().positive(),
	id: z.string().uuid(),
});

const GetTransactionRequestSchema = z.object({
	id: z.string().uuid(),
});

function simulateCardStatus(cardNumber: string): "paid" | "failed" {
	const failureNumbers = ["4000000000009995"];
	return failureNumbers.includes(cardNumber) ? "failed" : "paid";
}

@Controller("mock/provider2")
export class MockProvider2Controller {
	private readonly transactions: TransactionResponse[] = [];

	@Post("transactions")
	createTransaction(
		@Body() body: CreateTransactionRequest,
	): TransactionResponse {
		const dto = CreateTransactionRequestSchema.safeParse(body);
		if (!dto.success) throw new BadRequestException(dto.error);

		const status = simulateCardStatus(body.card.number);
		const now = new Date();

		const transaction: TransactionResponse = {
			id: uuidv4(),
			date: now.toISOString().split("T")[0],
			status,
			amount: body.amount,
			originalAmount: body.amount,
			currency: body.currency,
			statementDescriptor: body.statementDescriptor,
			paymentType: "card",
			cardId: uuidv4(),
		};
		this.transactions.push(transaction);

		return transaction;
	}

	@Post("void/:id")
	refund(
		@Body() body: { amount: number },
		@Param() param: { id: string },
	): TransactionResponse {
		const dto = RefundRequestSchema.safeParse({ ...body, ...param });
		if (!dto.success) throw new BadRequestException(dto.error);

		const transaction = this.transactions.find((c) => c.id === dto.data.id);
		if (!transaction)
			throw new BadRequestException(`Charge with id ${dto.data.id} not found`);

		if (transaction.status !== "paid")
			throw new BadRequestException(
				`Charge with id ${dto.data.id} is not paid`,
			);

		if (dto.data.amount > transaction.amount)
			throw new BadRequestException(
				"Refund amount greater than transaction amount",
			);

		transaction.status = "voided";
		transaction.amount -= dto.data.amount;

		return transaction;
	}

	@Get("transactions/:id")
	getTransaction(@Param() param: { id: string }): TransactionResponse {
		const dto = GetTransactionRequestSchema.safeParse(param);
		if (!dto.success) throw new BadRequestException(dto.error);

		const transaction = this.transactions.find((c) => c.id === dto.data.id);
		if (!transaction)
			throw new BadRequestException(
				`Transaction with id ${dto.data.id} not found`,
			);

		return transaction;
	}
}
