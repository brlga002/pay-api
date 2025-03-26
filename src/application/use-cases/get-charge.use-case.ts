import { Inject, Injectable, Logger } from "@nestjs/common";
import { IChargeRepository } from "@domain/repositories/payment.repository";
import { Charge } from "@domain/entities/charge.entity";

@Injectable()
export class GetChargeUseCase {
	private readonly logger = new Logger(GetChargeUseCase.name);

	constructor(
		@Inject("IChargeRepository")
		private readonly chargeRepository: IChargeRepository,
	) {}

	async execute(chargeId: string): Promise<Charge | null> {
		this.logger.log(`Finding charge with id ${chargeId}`);
		const charge = await this.chargeRepository.findById(chargeId);
		if (!charge) this.logger.warn(`Charge with id ${chargeId} not found`);
		return charge;
	}
}
