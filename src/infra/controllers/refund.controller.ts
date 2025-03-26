import {
	Controller,
	Post,
	Body,
	BadRequestException,
	NotFoundException,
	Param,
} from "@nestjs/common";
import { Charge } from "@domain/entities/charge.entity";
import { RefundUseCase } from "@application/use-cases/refund.use-case";
import { RefundChargeSchema } from "./dto/refund-charge.dto";

@Controller("refunds")
export class RefundController {
	constructor(private readonly refundUseCase: RefundUseCase) {}

	@Post(":chargeId")
	async create(
		@Body() body: { amount: number },
		@Param() param: { id: string },
	): Promise<Charge> {
		const dto = RefundChargeSchema.safeParse({ ...body, ...param });
		if (!dto.success) throw new BadRequestException(dto.error.errors);

		const charge = await this.refundUseCase.execute(
			dto.data.chargeId,
			dto.data.amount,
		);
		if (!charge)
			throw new NotFoundException(
				`Charge with id ${dto.data.chargeId} not found`,
			);

		return charge;
	}
}
