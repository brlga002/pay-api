import { PaymentMethod } from "@domain/entities/payment-method";
import { PaymentType } from "@domain/enums/payment-type.enum";
import { DomainError } from "@domain/exceptions/DomainError";

interface CreditProps {
	installments: number;
}

export class Credit extends PaymentMethod {
	_installments!: number;

	constructor(props: CreditProps) {
		super({ paymentType: PaymentType.CREDIT });
		this.installments = props.installments;
	}

	get installments() {
		return this._installments;
	}

	set installments(value: number) {
		if (value < 1)
			throw new DomainError("Invalid installments, must be greater than 0");
		this._installments = value;
	}

	toJSON() {
		return {
			...super.toJSON(),
			installments: this.installments,
		};
	}
}
