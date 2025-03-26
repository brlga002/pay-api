import { Charge } from "@domain/entities/charge.entity";
import { IFallbackPaymentService } from "@domain/services/fallback-payment.service";
import {
	PaymentProviderInterface,
	PaymentProviderResponse,
} from "@domain/services/payment-provider.interface";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class FallbackPaymentService implements IFallbackPaymentService {
	private readonly logger = new Logger(FallbackPaymentService.name);

	constructor(private readonly paymentProviders: PaymentProviderInterface[]) {}

	async processPayment(data: Charge): Promise<PaymentProviderResponse> {
		this.logger.log(`Processing charge ${data.id}`);
		for (const provider of this.paymentProviders) {
			try {
				this.logger.log(
					`Using provider '${provider.providerName}' to process charge ${data.id}`,
				);
				const providerResponse = await provider.createCharge(data);
				if (providerResponse.status === "failed") {
					this.logger.warn(
						`Provider '${provider.providerName}' failed to process charge ${data.id}`,
					);
					continue;
				}
				return providerResponse;
			} catch (err) {
				this.logger.error(
					`Provider ${provider.providerName} failed to process charge ${data.id}`,
				);
			}
		}
		throw new Error("All providers failed");
	}

	async refundPayment(props: {
		id: string;
		providerName: string;
		amount: number;
	}): Promise<{ success: boolean }> {
		const { id, providerName, amount } = props;
		this.logger.log(
			`Attempting to refund ${amount} using provider '${providerName}'`,
		);
		const provider = this.paymentProviders.find(
			(p) => p.providerName === providerName,
		);

		if (!provider) {
			this.logger.error(`Provider '${providerName}' not found`);
			throw new Error(`Provider '${providerName}' not found`);
		}

		try {
			const refundResponse = await provider.refundCharge(id, amount);
			if (refundResponse.success) {
				this.logger.log(
					`Refund of ${amount} successful using provider '${providerName}'`,
				);
				return refundResponse;
			}

			this.logger.warn(
				`Refund of ${amount} failed using provider '${providerName}'`,
			);
			return refundResponse;
		} catch (err) {
			this.logger.error(
				`Error processing refund with provider '${providerName}'`,
			);
			throw new Error(`Refund failed with provider '${providerName}'`);
		}
	}
}
