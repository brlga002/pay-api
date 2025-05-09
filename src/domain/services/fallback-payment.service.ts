import { Charge } from "@domain/entities/charge.entity";
import { PaymentProviderResponse } from "@domain/services/payment-provider.interface";

export interface IFallbackPaymentService {
	processPayment(charge: Charge): Promise<PaymentProviderResponse>;
	refundPayment(props: {
		id: string;
		providerName: string;
		amount: number;
	}): Promise<{ success: boolean }>;
}
