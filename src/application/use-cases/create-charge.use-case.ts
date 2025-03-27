import { Inject, Injectable, Logger } from "@nestjs/common";
import { Charge } from "@domain/entities/charge.entity";
import { IChargeRepository } from "@domain/repositories/payment.repository";
import { IFallbackPaymentService } from "@domain/services/fallback-payment.service";

@Injectable()
export class CreateChargeUseCase {
	private readonly logger = new Logger(CreateChargeUseCase.name);

	constructor(
		@Inject("IChargeRepository")
		private readonly chargeRepository: IChargeRepository,
		@Inject("IFallbackPaymentService")
		private readonly fallbackService: IFallbackPaymentService,
	) {}

	async execute(charge: Charge): Promise<Charge> {
		const existingPayment = await this.chargeRepository.find(
			charge.merchantId,
			charge.orderId,
		);

		if (!existingPayment) {
			this.logger.log(`Creating new charge ${charge.id}`);
			await this.chargeRepository.save(charge);
		} else {
			this.logger.log(`Charge ${existingPayment.id} already exists`);
			if (!existingPayment.isReadyToProcess()) {
				this.logger.warn(
					`Charge ${existingPayment.id} is not ready to process`,
				);
				return existingPayment;
			}
			charge.id = existingPayment.id;
		}

		const response = await this.fallbackService.processPayment(charge);
		charge.setProvider(response.provider);
		charge.setPaymentSource({
			id: response.cardId,
			status: response.status,
		});
		await this.chargeRepository.update(charge);

		return charge;
	}
}
