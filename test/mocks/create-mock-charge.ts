import { v4 as uuidv4 } from "uuid";
import { Card } from "@domain/entities/card.entity";
import { ChargeProps, Charge } from "@domain/entities/charge.entity";
import { Credit } from "@domain/entities/credt.entity";
import { PaymentStatus } from "@domain/enums/payment-status.enum";

export function createMockCharge(overrides: Partial<ChargeProps> = {}) {
	return Charge.create({
		id: "charge-id",
		merchantId: "merchant-1",
		orderId: uuidv4(),
		amount: 100,
		currency: "BRL",
		description: "Test charge",
		status: PaymentStatus.PENDING,
		paymentMethod: new Credit({
			installments: 1,
		}),
		paymentSource: {
			sourceType: "card",
			card: new Card({
				number: "4111111111111111",
				holderName: "John Doe",
				cvv: "123",
				expirationDate: "12/2026",
			}),
		},
		...overrides,
	});
}
