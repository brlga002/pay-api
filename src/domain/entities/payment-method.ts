import { enumValidator } from "@domain/enums/enum-validator";
import { PaymentType } from "@domain/enums/payment-type.enum";

export class PaymentMethod {
	_paymentType!: PaymentType;

	constructor(paymentType: PaymentType) {
		this.paymentType = paymentType;
	}

	get paymentType() {
		return this._paymentType;
	}

	set paymentType(value: PaymentType) {
		this._paymentType = enumValidator(PaymentType)(value, "paymentType");
	}

	toJSON() {
		return {
			paymentType: this.paymentType,
		};
	}
}
