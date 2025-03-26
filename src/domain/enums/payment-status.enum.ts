export const PaymentStatus = {
	PENDING: "pending",
	AUTHORIZED: "authorized",
	PAID: "paid",
	FAILED: "failed",
	REFUNDED: "refunded",
	VOIDED: "voided",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
