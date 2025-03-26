export const Currency = {
	BRL: "BRL",
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];
