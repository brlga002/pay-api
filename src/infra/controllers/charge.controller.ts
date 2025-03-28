import {
	Controller,
	Post,
	Body,
	BadRequestException,
	Get,
	Query,
	Param,
	NotFoundException,
} from "@nestjs/common";
import { Charge } from "@domain/entities/charge.entity";
import { PaymentStatus } from "@domain/enums/payment-status.enum";
import { Card } from "@domain/entities/card.entity";
import { CreateChargeUseCase } from "@application/use-cases/create-charge.use-case";
import { CreateChargeSchema } from "./dto/create-charge.dto";
import { Credit } from "@domain/entities/credt.entity";
import { ListChargesUseCase } from "@application/use-cases/list-charges.use-case";
import { ListChargeSchema } from "./dto/list-charges.dto";
import { GetChargeSchema } from "./dto/get-charge.dto";
import { GetChargeUseCase } from "@application/use-cases/get-charge.use-case";

@Controller("charges")
export class ChargeController {
	constructor(
		private readonly createPaymentUseCase: CreateChargeUseCase,
		private readonly listChargesUseCase: ListChargesUseCase,
		private readonly getChargeUseCase: GetChargeUseCase,
	) {}

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
		});

		return this.createPaymentUseCase.execute(payment);
	}

	@Get()
	async list(@Query() query: unknown) {
		const dto = ListChargeSchema.safeParse(query);
		if (!dto.success) throw new BadRequestException(dto.error.errors);

		return this.listChargesUseCase.execute(dto.data);
	}

	@Get(":chargeId")
	async getCharge(@Param() param: unknown) {
		const dto = GetChargeSchema.safeParse(param);
		if (!dto.success) throw new BadRequestException(dto.error.errors);
		const charge = await this.getChargeUseCase.execute(dto.data.chargeId);
		if (!charge)
			throw new NotFoundException(
				`Charge with id ${dto.data.chargeId} not found`,
			);
		return charge;
	}
}
