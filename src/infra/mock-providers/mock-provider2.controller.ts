import {
	BadRequestException,
	Body,
	Controller,
	Logger,
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

function simulateCardStatus(cardNumber: string): "paid" | "failed" {
	const failureNumbers = ["4000000000009995"];
	return failureNumbers.includes(cardNumber) ? "failed" : "paid";
}

@Controller("mock/provider2")
export class MockProvider2Controller {
	static readonly providerId = "mock-provider2-id";

	private readonly logger = new Logger(MockProvider2Controller.name);
	private readonly transactions: TransactionResponse[] = [];

	@Post("transactions")
	createTransaction(
		@Body() body: CreateTransactionRequest,
	): TransactionResponse {
		this.logger.log(body, "CreateTransaction request");

		const dto = CreateTransactionRequestSchema.safeParse(body);
		if (!dto.success) {
			this.logger.error(`Invalid request: ${dto.error.message}`);
			throw new BadRequestException(dto.error);
		}

		const status = simulateCardStatus(body.card.number);
		const now = new Date();

		const transaction: TransactionResponse = {
			id: MockProvider2Controller.providerId,
			date: now.toISOString().split("T")[0],
			status,
			amount: body.amount,
			originalAmount: body.amount,
			currency: body.currency,
			statementDescriptor: body.statementDescriptor,
			paymentType: "card",
			cardId: uuidv4(),
		};

		if (status === "failed") {
			this.logger.error(transaction, "Failed to create transaction");
			return transaction;
		}

		this.transactions.push(transaction);
		this.logger.log(transaction, "Transaction created");
		return transaction;
	}
}
