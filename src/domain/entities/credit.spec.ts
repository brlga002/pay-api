import { Credit } from "./credt.entity";
import { DomainError } from "@domain/exceptions/DomainError";
import { PaymentType } from "@domain/enums/payment-type.enum";

describe("Credit", () => {
	it("should create a valid credit payment method", () => {
		const credit = new Credit({ installments: 3 });

		expect(credit.installments).toBe(3);
		expect(credit.paymentType).toBe(PaymentType.CREDIT);
	});

	it("should throw if installments is less than 1", () => {
		expect(() => new Credit({ installments: 0 })).toThrow(DomainError);
		expect(() => new Credit({ installments: -5 })).toThrow(
			"Invalid installments, must be greater than 0",
		);
	});

	it("should allow updating installments after creation", () => {
		const credit = new Credit({ installments: 2 });
		credit.installments = 5;

		expect(credit.installments).toBe(5);
	});

	it("should return correct JSON structure", () => {
		const credit = new Credit({ installments: 4 });

		expect(credit.toJSON()).toEqual({
			paymentType: PaymentType.CREDIT,
			installments: 4,
		});
	});
});
