import { PaymentMethod } from "@domain/entities/payment-method";
import { PaymentType } from "@domain/enums/payment-type.enum";
import { DomainError } from "@domain/exceptions/DomainError";

interface CardProps {
	number: string;
	holderName: string;
	cvv: string;
	expirationDate: string;
	installments: number;
}

export class Card extends PaymentMethod {
	_number!: string;
	_holderName!: string;
	_cvv!: string;
	_expirationDate!: string;
	_installments!: number;

	constructor(props: CardProps) {
		super(PaymentType.CREDIT);
		this.number = props.number;
		this.holderName = props.holderName;
		this.cvv = props.cvv;
		this.expirationDate = props.expirationDate;
		this.installments = props.installments;
	}

	get number() {
		return this._number;
	}

	set number(value: string) {
		const sanitizedValue = value.replace(/\s/g, "");
		if (!/^\d+$/.test(sanitizedValue))
			throw new DomainError("Invalid card number, must contain only digits");

		if (sanitizedValue.length !== 16)
			throw new DomainError("Invalid card number length, must be 16 digits");

		if (!Card.luhnCheck(sanitizedValue))
			throw new DomainError("Invalid card number, failed Luhn algorithm");

		this._number = sanitizedValue;
	}

	get holderName() {
		return this._holderName;
	}

	set holderName(value: string) {
		if (!value || value === "")
			throw new DomainError("Invalid holder name, must not be empty");
		if (value.length < 3)
			throw new DomainError(
				"Invalid holder name, must contain at least 3 characters",
			);

		this._holderName = value;
	}

	get cvv() {
		return this._cvv;
	}

	set cvv(value: string) {
		const sanitizedValue = value.replace(/\s/g, "");
		if (!/^\d+$/.test(sanitizedValue))
			throw new DomainError("Invalid cvv, must contain only digits");

		if (sanitizedValue.length !== 3)
			throw new DomainError("Invalid cvv length, must be 3 digits");

		this._cvv = sanitizedValue;
	}

	get expirationDate() {
		return this._expirationDate;
	}

	set expirationDate(value: string) {
		const sanitizedValue = value.replace(/\s/g, "");

		if (!/^(\d{1,2})\/\d{4}$/.test(sanitizedValue))
			throw new DomainError(
				`Invalid expiration date format, must be MM/YYYY, received ${sanitizedValue}`,
			);

		const [month, year] = sanitizedValue.split("/").map(Number);

		if (month < 1 || month > 12)
			throw new DomainError(
				"Invalid expiration month, must be between 1 and 12",
			);

		const expirationDate = new Date(year, month, 0);
		const now = new Date();

		if (expirationDate < now)
			throw new DomainError("Card is expired", {
				expirationDate: sanitizedValue,
			});

		this._expirationDate = `${String(month).padStart(2, "0")}/${year}`;
	}

	get installments() {
		return this._installments;
	}

	set installments(value: number) {
		if (value < 1)
			throw new DomainError("Invalid installments, must be greater than 0");

		this._installments = value;
	}

	static luhnCheck(value: string): boolean {
		const digits = value.split("").map(Number);
		const parity = digits.length % 2;

		return (
			digits.reduce((acc, digit, index) => {
				let modifiedDigit = digit;
				if (index % 2 === parity) modifiedDigit *= 2;
				if (modifiedDigit > 9) modifiedDigit -= 9;
				return acc + modifiedDigit;
			}, 0) %
				10 ===
			0
		);
	}

	toJSON() {
		return {
			...super.toJSON(),
			number: this.number,
			holderName: this.holderName,
			cvv: this.cvv,
			expirationDate: this.expirationDate,
			installments: this._installments,
		};
	}
}
