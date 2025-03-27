import { FallbackPaymentService } from "./fallback-payment.service";
import { Charge } from "@domain/entities/charge.entity";
import { PaymentProviderInterface } from "@domain/services/payment-provider.interface";
import { Logger } from "@nestjs/common";

const createMockProvider = (
	name: string,
	behavior: Partial<PaymentProviderInterface>,
): PaymentProviderInterface => ({
	providerName: name,
	createCharge: jest.fn(),
	refundCharge: jest.fn(),
	...behavior,
});

describe("FallbackPaymentService", () => {
	let service: FallbackPaymentService;
	let charge: Charge;

	beforeEach(() => {
		charge = {
			id: "charge-123",
		} as unknown as Charge;
	});

	it("should return success from the first working provider", async () => {
		const successProvider = createMockProvider("A", {
			createCharge: jest
				.fn()
				.mockResolvedValue({ status: "paid", provider: "A" }),
		});

		service = new FallbackPaymentService([successProvider]);

		const result = await service.processPayment(charge);
		expect(result.status).toBe("paid");
		expect(successProvider.createCharge).toHaveBeenCalledWith(charge);
	});

	it("should try next provider if one fails with status 'failed'", async () => {
		const failProvider = createMockProvider("A", {
			createCharge: jest.fn().mockResolvedValue({ status: "failed" }),
		});

		const successProvider = createMockProvider("B", {
			createCharge: jest
				.fn()
				.mockResolvedValue({ status: "paid", provider: "B" }),
		});

		service = new FallbackPaymentService([failProvider, successProvider]);

		const result = await service.processPayment(charge);
		expect(result.status).toBe("paid");
		expect(successProvider.createCharge).toHaveBeenCalled();
	});

	it("should skip provider if createCharge throws and try next", async () => {
		const errorProvider = createMockProvider("A", {
			createCharge: jest.fn().mockRejectedValue(new Error("fail")),
		});

		const successProvider = createMockProvider("B", {
			createCharge: jest
				.fn()
				.mockResolvedValue({ status: "paid", provider: "B" }),
		});

		service = new FallbackPaymentService([errorProvider, successProvider]);

		const result = await service.processPayment(charge);
		expect(result.status).toBe("paid");
		expect(successProvider.createCharge).toHaveBeenCalled();
	});

	it("should throw if all providers fail", async () => {
		const provider1 = createMockProvider("A", {
			createCharge: jest.fn().mockResolvedValue({ status: "failed" }),
		});

		const provider2 = createMockProvider("B", {
			createCharge: jest.fn().mockRejectedValue(new Error("fail")),
		});

		service = new FallbackPaymentService([provider1, provider2]);

		await expect(service.processPayment(charge)).rejects.toThrow(
			"All providers failed",
		);
	});

	it("should refund using correct provider", async () => {
		const refundProvider = createMockProvider("A", {
			refundCharge: jest.fn().mockResolvedValue({ success: true }),
		});

		service = new FallbackPaymentService([refundProvider]);

		const result = await service.refundPayment({
			id: "charge-1",
			amount: 100,
			providerName: "A",
		});

		expect(result.success).toBe(true);
		expect(refundProvider.refundCharge).toHaveBeenCalledWith("charge-1", 100);
	});

	it("should throw if provider is not found", async () => {
		service = new FallbackPaymentService([]);

		await expect(
			service.refundPayment({
				id: "charge-1",
				amount: 100,
				providerName: "NotFound",
			}),
		).rejects.toThrow("Provider 'NotFound' not found");
	});

	it("should throw if refund fails internally", async () => {
		const refundProvider = createMockProvider("A", {
			refundCharge: jest.fn().mockRejectedValue(new Error("internal error")),
		});

		service = new FallbackPaymentService([refundProvider]);

		await expect(
			service.refundPayment({
				id: "charge-1",
				amount: 100,
				providerName: "A",
			}),
		).rejects.toThrow("Refund failed with provider 'A'");
	});

	it("should log warning and return false if refund fails but does not throw", async () => {
		const refundProvider = createMockProvider("A", {
			refundCharge: jest.fn().mockResolvedValue({ success: false }),
		});

		const warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation();

		service = new FallbackPaymentService([refundProvider]);

		const result = await service.refundPayment({
			id: "charge-1",
			amount: 100,
			providerName: "A",
		});

		expect(result.success).toBe(false);
		expect(refundProvider.refundCharge).toHaveBeenCalledWith("charge-1", 100);
		expect(warnSpy).toHaveBeenCalledWith(
			`Refund of 100 failed using provider 'A'`,
		);
	});
});
