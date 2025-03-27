import { PaymentMethod } from "./payment-method";
import { PaymentType } from "@domain/enums/payment-type.enum";
import { DomainError } from "@domain/exceptions/DomainError";

describe("PaymentMethod", () => {
	it("should create a PaymentMethod with a valid payment type", () => {
		const method = new PaymentMethod({ paymentType: PaymentType.CREDIT });
		expect(method.paymentType).toBe(PaymentType.CREDIT);
	});

	it("should throw an error when given an invalid payment type", () => {
		expect(() => {
			new PaymentMethod({ paymentType: "pix" as unknown as PaymentType });
		}).toThrow(
			`Invalid value for "paymentType": received "pix", expected "credit"`,
		);
	});

	it("should return correct JSON output", () => {
		const method = new PaymentMethod({ paymentType: PaymentType.CREDIT });
		expect(method.toJSON()).toEqual({ paymentType: PaymentType.CREDIT });
	});

	it("should throw if trying to set an invalid payment type after construction", () => {
		const method = new PaymentMethod({ paymentType: PaymentType.CREDIT });
		expect(() => {
			method.paymentType = "cash" as unknown as PaymentType;
		}).toThrow(DomainError);
	});
});
