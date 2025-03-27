import { Currency } from "./currency.enum";

describe("Currency Enum", () => {
	it("should accept a valid currency", () => {
		const value: Currency = "BRL";
		expect(value).toBe("BRL");
	});

	it("should reject an invalid currency at compile time", () => {
		const isCurrency = (val: string): val is Currency => {
			return Object.values(Currency).includes(val as Currency);
		};

		expect(isCurrency("BRL")).toBe(true);
		expect(isCurrency("USD")).toBe(false);
	});

	it("should include BRL as a valid currency", () => {
		expect(Currency.BRL).toBe("BRL");
	});

	it("should have only one currency defined", () => {
		expect(Object.keys(Currency)).toEqual(["BRL"]);
	});
});
