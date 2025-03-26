import { Controller, Post, Body, BadRequestException } from "@nestjs/common";
import { Charge } from "@domain/entities/charge.entity";
import { PaymentStatus } from "src/domain/enums/payment-status.enum";
import { Card } from "src/domain/entities/card.entity";
import { CreateChargeUseCase } from "@application/use-cases/create-charge.use-case";
import { CreateChargeSchema } from "./dto/create-charge.dto";
import { Credit } from "@domain/entities/credt.entity";

@Controller("charges")
export class ChargeController {
	constructor(private readonly createPaymentUseCase: CreateChargeUseCase) {}

	@Post()
	async create(@Body() body: unknown): Promise<Charge> {
		const dto = CreateChargeSchema.safeParse(body);
		if (!dto.success) throw new BadRequestException(dto.error.errors);

		const payment = Charge.create({
			id: crypto.randomUUID(),
			merchantId: dto.data.merchantId,
			orderId: dto.data.orderId,
			amount: dto.data.amount,
			currency: dto.data.currency,
			description: dto.data.description,
			status: PaymentStatus.PENDING,
			paymentMethod: new Credit({
				installments: dto.data.paymentMethod.installments,
			}),
			paymentSource: {
				sourceType: "card",
				card: new Card({
					number: dto.data.paymentMethod.card.number,
					holderName: dto.data.paymentMethod.card.holderName,
					cvv: dto.data.paymentMethod.card.cvv,
					expirationDate: dto.data.paymentMethod.card.expirationDate,
				}),
			},
			currentAmount: dto.data.amount,
			createdAt: new Date(),
		});

		return this.createPaymentUseCase.execute(payment);
	}
}
