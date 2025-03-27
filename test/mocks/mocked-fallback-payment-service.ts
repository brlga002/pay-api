import { IFallbackPaymentService } from "@domain/services/fallback-payment.service";

export class MockedFallbackPaymentService implements IFallbackPaymentService {
	processPayment = jest.fn();
	refundPayment = jest.fn();
}
