import { Card } from "@domain/entities/card.entity";

describe("Card", () => {
	it("should create a valid card with all correct fields", () => {
		const card = new Card({
			number: "4111111111111111",
			holderName: "João da Silva",
			cvv: "123",
			expirationDate: "12/2099",
		});

		expect(card.number).toBe("4111111111111111");
		expect(card.holderName).toBe("João da Silva");
		expect(card.cvv).toBe("123");
		expect(card.expirationDate).toBe("12/2099");
	});

	it("should create a valid card with all correct fields with a single digit month", () => {
		const card = new Card({
			number: "4111111111111111",
			holderName: "João da Silva",
			cvv: "123",
			expirationDate: "1/2099",
		});

		expect(card.number).toBe("4111111111111111");
		expect(card.holderName).toBe("João da Silva");
		expect(card.cvv).toBe("123");
		expect(card.expirationDate).toBe("01/2099");
	});

	it("should throw an error if the card number contains letters", () => {
		expect(() => {
			new Card({
				number: "4111 1111 1111 abcd",
				holderName: "João",
				cvv: "123",
				expirationDate: "12/2099",
			});
		}).toThrow("Invalid card number, must contain only digits");
	});

	it("should throw an error if the card number is not 16 digits long", () => {
		expect(() => {
			new Card({
				number: "411111111111",
				holderName: "João",
				cvv: "123",
				expirationDate: "12/2099",
			});
		}).toThrow("Invalid card number length, must be 16 digits");
	});

	it("should throw an error if the card number fails the Luhn algorithm", () => {
		expect(() => {
			new Card({
				number: "1234567812345678",
				holderName: "João",
				cvv: "123",
				expirationDate: "12/2099",
			});
		}).toThrow("Invalid card number, failed Luhn algorithm");
	});

	it("should throw an error if the holder name is empty", () => {
		expect(() => {
			new Card({
				number: "4111111111111111",
				holderName: "",
				cvv: "123",
				expirationDate: "12/2099",
			});
		}).toThrow("Invalid holder name, must not be empty");
	});

	it("should throw an error if the holder name is less than 3 characters", () => {
		expect(() => {
			new Card({
				number: "4111111111111111",
				holderName: "Jo",
				cvv: "123",
				expirationDate: "12/2099",
			});
		}).toThrow("Invalid holder name, must contain at least 3 characters");
	});

	it("should throw an error if the CVV contains non-digit characters", () => {
		expect(() => {
			new Card({
				number: "4111111111111111",
				holderName: "João",
				cvv: "12a",
				expirationDate: "12/2099",
			});
		}).toThrow("Invalid cvv, must contain only digits");
	});

	it("should throw an error if the CVV is not 3 digits long", () => {
		expect(() => {
			new Card({
				number: "4111111111111111",
				holderName: "João",
				cvv: "12",
				expirationDate: "12/2099",
			});
		}).toThrow("Invalid cvv length, must be 3 digits");
	});

	it("should throw an error if the expiration date has an invalid format", () => {
		expect(() => {
			new Card({
				number: "4111111111111111",
				holderName: "João",
				cvv: "123",
				expirationDate: "2099-12",
			});
		}).toThrow("Invalid expiration date format, must be MM/YYYY");
	});

	it("should throw an error if the expiration month is invalid", () => {
		expect(() => {
			new Card({
				number: "4111111111111111",
				holderName: "João",
				cvv: "123",
				expirationDate: "13/2099",
			});
		}).toThrow("Invalid expiration month, must be between 1 and 12");
	});

	it("should throw an error if the card is expired", () => {
		const pastYear = new Date().getFullYear() - 1;
		expect(() => {
			new Card({
				number: "4111111111111111",
				holderName: "João",
				cvv: "123",
				expirationDate: `01/${pastYear}`,
			});
		}).toThrow("Card is expired");
	});

	it("should throw an error if the card number is empty", () => {
		const pastYear = new Date().getFullYear() - 1;
		expect(() => {
			new Card({
				number: "",
				holderName: "João",
				cvv: "123",
				expirationDate: `01/${pastYear}`,
			});
		}).toThrow("Invalid card number, must not be empty");
	});

	it("should return JSON correctly with all data", () => {
		const card = new Card({
			number: "4111111111111111",
			holderName: "João da Silva",
			cvv: "123",
			expirationDate: "12/2099",
		});

		expect(card.toJSON()).toBeNull();
	});
});
