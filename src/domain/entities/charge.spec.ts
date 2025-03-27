import { Charge, ChargeProps } from "./charge.entity";
import { PaymentStatus } from "@domain/enums/payment-status.enum";
import { Currency } from "@domain/enums/currency.enum";
import { Credit } from "./credt.entity";
import { Provider } from "./provider.entity";

const makeCharge = (overrides?: Partial<ChargeProps>): Charge => {
	return Charge.create({
		id: "charge-1",
		merchantId: "merchant-1",
		orderId: "order-1",
		amount: 1000,
		currency: Currency.BRL,
		description: "Test charge",
		status: PaymentStatus.PAID,
		paymentMethod: new Credit({ installments: 2 }),
		providerId: "provider-123",
		providerName: "Stripe",
		currentAmount: 1000,
		paymentSource: {
			sourceType: "card",
			cardId: "card-1",
		},
		...overrides,
	});
};

describe("Charge Entity", () => {
	it("should create a valid charge", () => {
		const charge = makeCharge();
		expect(charge.amount).toBe(1000);
		expect(charge.currency).toBe(Currency.BRL);
	});

	it("should refund a valid amount", () => {
		const charge = makeCharge();
		charge.refund(400);
		expect(charge.currentAmount).toBe(600);
		expect(charge.status).toBe(PaymentStatus.REFUNDED);
	});

	it("should throw if refunding more than current amount", () => {
		const charge = makeCharge();
		expect(() => charge.refund(1500)).toThrow(
			"Refund amount is greater than current amount",
		);
	});

	it("should throw if refund not allowed", () => {
		const charge = makeCharge({
			status: PaymentStatus.PENDING,
		});
		expect(() => charge.refund(100)).toThrow("Charge cannot be refunded");
	});

	it("should cancel a refund", () => {
		const charge = makeCharge();
		charge.refund(500);
		charge.cancelRefund(500);
		expect(charge.currentAmount).toBe(1000);
		expect(charge.status).toBe(PaymentStatus.PAID);
	});

	it("should set payment source", () => {
		const charge = makeCharge();
		charge.setPaymentSource({
			id: "source-123",
			status: PaymentStatus.PAID,
		});
		expect(charge.paymentSource.id).toBe("source-123");
		expect(charge.status).toBe(PaymentStatus.PAID);
	});

	it("should set provider", () => {
		const charge = makeCharge({ providerId: null, providerName: null });
		const provider = new Provider("provider-1", "Braintree");
		charge.setProvider(provider);
		expect(charge.providerId).toBe("provider-1");
		expect(charge.providerName).toBe("Braintree");
	});

	it("should validate readiness to process", () => {
		const charge = makeCharge({
			status: PaymentStatus.PENDING,
			providerId: null,
		});
		expect(charge.isReadyToProcess()).toBe(true);
	});

	it("should not be ready if provider already set", () => {
		const charge = makeCharge({
			status: PaymentStatus.PENDING,
			providerId: "provider-1",
		});
		expect(charge.isReadyToProcess()).toBe(false);
	});

	it("should return true for allowRefund if paid, has amount and provider", () => {
		const charge = makeCharge();
		expect(charge.allowRefund()).toBe(true);
	});

	it("should throw if providerId is missing", () => {
		const charge = makeCharge({ providerId: null });
		expect(() => charge.getProviderIdOrThrow()).toThrow("ProviderId not set");
	});

	it("should throw if providerName is missing", () => {
		const charge = makeCharge({ providerName: null });
		expect(() => charge.getProviderNameOrThrow()).toThrow(
			"ProviderName not set",
		);
	});

	it("should return correct JSON structure", () => {
		const charge = makeCharge();
		const json = charge.toJSON();

		expect(json).toMatchObject({
			id: "charge-1",
			merchantId: "merchant-1",
			orderId: "order-1",
			amount: 1000,
			currency: Currency.BRL,
			description: "Test charge",
			status: PaymentStatus.PAID,
			providerId: "provider-123",
			providerName: "Stripe",
			currentAmount: 1000,
			paymentSource: {
				id: undefined,
				sourceType: "card",
			},
		});
	});
});
