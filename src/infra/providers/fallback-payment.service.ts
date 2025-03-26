import { Charge } from "@domain/entities/charge.entity";
import {
	PaymentProviderInterface,
	PaymentProviderResponse,
} from "@domain/services/payment-provider.interface";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class FallbackPaymentService {
	private readonly logger = new Logger(FallbackPaymentService.name);

	constructor(private readonly paymentProviders: PaymentProviderInterface[]) {}

	async processPayment(data: Charge): Promise<PaymentProviderResponse> {
		this.logger.log(`Processing charge ${data.id}`);
		for (const provider of this.paymentProviders) {
			try {
				this.logger.log(
					`Using provider '${provider.name}' to process charge ${data.id}`,
				);
				const providerResponse = await provider.createCharge(data);
				if (providerResponse.status === "failed") {
					this.logger.warn(
						`Provider '${provider.name}' failed to process charge ${data.id}`,
					);
					continue;
				}
				return providerResponse;
			} catch (err) {
				this.logger.error(
					`Provider ${provider.name} failed to process charge ${data.id}`,
				);
			}
		}
		throw new Error("All providers failed");
	}
}
