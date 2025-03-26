import { Charge } from "@domain/entities/charge.entity";
import { Provider } from "@domain/entities/provider.entity";
import { PaymentStatus } from "@domain/enums/payment-status.enum";

export interface PaymentProviderResponse {
	status: PaymentStatus;
	cardId: string;
	provider: Provider;
}

export interface PaymentProviderInterface {
	name: string;
	createCharge(data: Charge): Promise<PaymentProviderResponse>;
}
