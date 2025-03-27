import { PaymentStatus } from "../enums/payment-status.enum";
import { Provider } from "./provider.entity";
import { Card } from "./card.entity";
import { Currency } from "@domain/enums/currency.enum";
import { Credit } from "./credt.entity";
import { DomainError } from "@domain/exceptions/DomainError";

export interface ChargeProps {
	id: string;
	merchantId: string;
	orderId: string;
	amount: number;
	currency: Currency;
	description: string;
	status: PaymentStatus;
	paymentMethod: Credit;
	providerId?: string | null;
	providerName?: string | null;
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
	providerName: string | null;
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
		this.providerName = props.providerName ?? null;
		this.currentAmount = props.currentAmount ?? props.amount;
		this.paymentSource = props.paymentSource;
		this.createdAt = props.createdAt ?? new Date();
		this.updateAt = props.updateAt ?? null;
	}

	static create(props: ChargeProps) {
		const payment = new Charge(props);
		return payment;
	}

	refund(amount: number) {
		if (!this.allowRefund()) throw new DomainError("Charge cannot be refunded");
		if (amount > this.currentAmount)
			throw new DomainError("Refund amount is greater than current amount");

		this.currentAmount -= amount;
		this.status = PaymentStatus.REFUNDED;
	}

	cancelRefund(amount: number) {
		this.currentAmount += amount;
		this.status = PaymentStatus.PAID;
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
		this.providerName = provider.name;
	}

	isReadyToProcess() {
		const validStatus =
			this.status === PaymentStatus.PENDING ||
			this.status === PaymentStatus.FAILED;
		return validStatus && !this.providerId;
	}

	allowRefund() {
		return (
			this.status === PaymentStatus.PAID &&
			this.currentAmount > 0 &&
			this.providerId !== null
		);
	}

	getProviderIdOrThrow() {
		if (!this.providerId) throw new DomainError("ProviderId not set");
		return this.providerId;
	}

	getProviderNameOrThrow() {
		if (!this.providerName) throw new DomainError("ProviderName not set");
		return this.providerName;
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
			providerName: this.providerName,
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
