import { enumValidator } from "./enum-validator";

describe("enumValidator", () => {
	it("should return the value when it is valid (multi-value enum)", () => {
		const Status = {
			ACTIVE: "active",
			INACTIVE: "inactive",
		} as const;

		const result = enumValidator(Status, "active", "status");
		expect(result).toBe("active");
	});

	it("should throw DomainError with list of expected values (multi-value enum)", () => {
		const Status = {
			ACTIVE: "active",
			INACTIVE: "inactive",
		} as const;

		expect(() => enumValidator(Status, "pending", "status")).toThrow(
			'Invalid value for "status": received "pending", expected one of: active, inactive',
		);
	});

	it("should return the value when it is valid (single-value enum)", () => {
		const PaymentType = {
			CREDIT: "credit",
		} as const;

		const result = enumValidator(PaymentType, "credit", "paymentType");
		expect(result).toBe("credit");
	});

	it("should throw DomainError with specific expected value (single-value enum)", () => {
		const PaymentType = {
			CREDIT: "credit",
		} as const;

		expect(() => enumValidator(PaymentType, "debit", "paymentType")).toThrow(
			'Invalid value for "paymentType": received "debit", expected "credit"',
		);
	});
});
