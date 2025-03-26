import { Inject, Injectable, Logger } from "@nestjs/common";
import { IChargeRepository } from "@domain/repositories/payment.repository";
import { Charge } from "@domain/entities/charge.entity";
import { IFallbackPaymentService } from "@domain/services/fallback-payment.service";

@Injectable()
export class RefundUseCase {
	private readonly logger = new Logger(RefundUseCase.name);

	constructor(
		@Inject("IChargeRepository")
		private readonly chargeRepository: IChargeRepository,
		@Inject("IFallbackPaymentService")
		private readonly fallbackService: IFallbackPaymentService,
	) {}

	async execute(chargeId: string): Promise<Charge | null> {
		this.logger.log(`Finding charge with id ${chargeId}`);
		const charge = await this.chargeRepository.findById(chargeId);
		if (!charge) {
			this.logger.warn(`Charge with id ${chargeId} not found`);
			return null;
		}
		if (!charge.allowRefund()) {
			this.logger.warn(`Charge with id ${chargeId} cannot be refunded`);
			return charge;
		}

		this.logger.log(`Refunding charge with id ${chargeId}`);
		const { amount, providerId } = charge.refund();
		await this.chargeRepository.save(charge);

		const refundResult = await this.fallbackService.refundPayment(
			providerId,
			amount,
		);
		if (!refundResult.success) {
			charge.cancelRefund(amount);
			await this.chargeRepository.save(charge);
		}
		return null;
	}
}
