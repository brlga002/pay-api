import {
	Controller,
	Post,
	Body,
	BadRequestException,
	NotFoundException,
} from "@nestjs/common";
import { Charge } from "@domain/entities/charge.entity";
import { RefundUseCase } from "@application/use-cases/refund.use-case";
import { GetChargeSchema } from "./dto/get-charge.dto";

@Controller("refunds")
export class RefundController {
	constructor(private readonly refundUseCase: RefundUseCase) {}

	@Post()
	async create(@Body() body: unknown): Promise<Charge> {
		const dto = GetChargeSchema.safeParse(body);
		if (!dto.success) throw new BadRequestException(dto.error.errors);

		const charge = await this.refundUseCase.execute(dto.data.chargeId);
		if (!charge)
			throw new NotFoundException(
				`Charge with id ${dto.data.chargeId} not found`,
			);

		return charge;
	}
}
