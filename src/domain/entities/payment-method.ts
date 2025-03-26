import { enumValidator } from "@domain/enums/enum-validator";
import { PaymentType } from "@domain/enums/payment-type.enum";

interface PaymentMethodProps {
	paymentType: PaymentType;
}
export class PaymentMethod {
	_paymentType!: PaymentType;

	constructor(props: PaymentMethodProps) {
		this.paymentType = props.paymentType;
	}

	get paymentType() {
		return this._paymentType;
	}

	set paymentType(value: PaymentType) {
		this._paymentType = enumValidator(PaymentType, value, "paymentType");
	}

	toJSON() {
		return {
			paymentType: this.paymentType,
		};
	}
}
