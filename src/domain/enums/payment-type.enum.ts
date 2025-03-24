export const PaymentType = {
	CREDIT: "credit",
} as const;

export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];
