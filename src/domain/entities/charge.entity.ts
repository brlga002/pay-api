import { PaymentStatus } from "../enums/payment-status.enum";
import { Provider } from "./provider.entity";
import { Card } from "./card.entity";
import { Currency } from "@domain/enums/currency.enum";
import { Credit } from "./credt.entity";

interface ChargeProps {
	id: string;
	merchantId: string;
	orderId: string;
	amount: number;
	currency: Currency;
	description: string;
	status: PaymentStatus;
	paymentMethod: Credit;
	providerId?: string | null;
	provider?: string | null;
	currentAmount?: number;
	paymentSource: {
		sourceType: string;
		cardId?: string;
		card?: Card;
	};
	createdAt?: Date;
	updateAt?: Date | null;
}

export class Charge {
	id: string;
	merchantId: string;
	orderId: string;
	readonly amount: number;
	readonly currency: Currency;
	readonly description: string;
	status: PaymentStatus;
	readonly paymentMethod: Credit;
	providerId: string | null;
	provider: string | null;
	currentAmount: number;
	paymentSource: {
		sourceType: string;
		id?: string;
		card?: Card;
	};
	readonly createdAt: Date;
	updateAt?: Date | null;

	private constructor(props: ChargeProps) {
		this.id = props.id;
		this.merchantId = props.merchantId;
		this.orderId = props.orderId;
		this.amount = props.amount;
		this.currency = props.currency;
		this.description = props.description;
		this.status = props.status;
		this.paymentMethod = props.paymentMethod;
		this.providerId = props.providerId ?? null;
		this.provider = props.provider ?? null;
		this.currentAmount = props.currentAmount ?? props.amount;
		this.paymentSource = props.paymentSource;
		this.createdAt = props.createdAt ?? new Date();
		this.updateAt = props.updateAt ?? null;
	}

	static create(props: ChargeProps) {
		const payment = new Charge(props);
		return payment;
	}

	authorize() {
		this.status = PaymentStatus.AUTHORIZED;
	}

	fail() {
		this.status = PaymentStatus.FAILED;
	}

	refund(amount: number) {
		this.currentAmount -= amount;
		this.status = PaymentStatus.REFUNDED;
	}

	setPaymentSource(props: {
		id: string;
		status: PaymentStatus;
	}) {
		const { id, status } = props;
		this.paymentSource.id = id;
		this.status = status;
	}

	setProvider(provider: Provider) {
		this.providerId = provider.id;
		this.provider = provider.name;
	}

	isReadyToProcess() {
		return this.status === PaymentStatus.PENDING;
	}

	toJSON() {
		return {
			id: this.id,
			merchantId: this.merchantId,
			orderId: this.orderId,
			amount: this.amount,
			currency: this.currency,
			description: this.description,
			status: this.status,
			paymentMethod: this.paymentMethod.toJSON(),
			providerId: this.providerId,
			provider: this.provider,
			currentAmount: this.currentAmount,
			paymentSource: {
				id: this.paymentSource?.id,
				sourceType: this.paymentSource.sourceType,
			},
			createdAt: this.createdAt,
			updateAt: this.updateAt,
		};
	}
}
