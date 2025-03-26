import { Inject, Injectable, Logger } from "@nestjs/common";
import { FallbackPaymentService } from "src/infra/providers/fallback-payment.service";
import { Charge } from "@domain/entities/charge.entity";
import { IChargeRepository } from "@domain/repositories/payment.repository";

@Injectable()
export class CreateChargeUseCase {
	private readonly logger = new Logger(CreateChargeUseCase.name);

	constructor(
		@Inject("IChargeRepository")
		private readonly ChargeRepository: IChargeRepository,
		private readonly fallbackService: FallbackPaymentService,
	) {}

	async execute(charge: Charge): Promise<Charge> {
		const existingPayment = await this.ChargeRepository.find(
			charge.merchantId,
			charge.orderId,
		);

		if (!existingPayment) {
			this.logger.log(`Creating new charge ${charge.id}`);
			await this.ChargeRepository.save(charge);
		} else {
			this.logger.log(`Charge ${existingPayment.id} already exists`);
			if (!existingPayment.isReadyToProcess()) {
				this.logger.warn(
					`Charge ${existingPayment.id} is not ready to process`,
				);
				return existingPayment;
			}
		}

		const response = await this.fallbackService.processPayment(charge);
		charge.setProvider(response.provider);
		charge.setPaymentSource({
			id: response.cardId,
			status: response.status,
		});
		await this.ChargeRepository.update(charge);

		return charge;
	}
}
