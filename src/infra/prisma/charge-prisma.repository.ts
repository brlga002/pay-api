import { Injectable } from "@nestjs/common";

import { IChargeRepository } from "src/domain/repositories/payment.repository";
import { Charge } from "@domain/entities/charge.entity";
import { PrismaService } from "./prisma.service";
import { Card } from "@domain/entities/card.entity";

@Injectable()
export class ChargePrismaRepository implements IChargeRepository {
	constructor(private readonly client: PrismaService) {}

	async find(merchantId: string, orderId: string): Promise<Charge | null> {
		const payment = await this.client.prismaCharge.findUnique({
			where: {
				merchantId_orderId: {
					merchantId,
					orderId,
				},
			},
		});
		if (!payment) return null;

		return Charge.create({
			...payment,
			paymentMethod: {} as Card,
		});
	}

	async save(payment: Charge): Promise<void> {
		const result = await this.client.prismaCharge.create({
			select: {
				id: true,
			},
			data: {
				id: payment.id,
				merchantId: payment.merchantId,
				orderId: payment.orderId,
				amount: payment.amount,
				currency: payment.currency,
				description: payment.description,
				status: payment.status,
				currentAmount: payment.currentAmount,
				paymentMethod: payment.paymentMethod.paymentType,
				providerId: payment.providerId,
				createdAt: payment.createdAt,
			},
		});
		payment.id = result.id;
	}

	async update(payment: Charge): Promise<void> {
		await this.client.prismaCharge.update({
			where: {
				id: payment.id,
			},
			data: {
				paymentMethod: payment.paymentMethod.paymentType,
				paymentSourceType: payment.paymentSource?.sourceType,
				paymentSourceId: payment.paymentSource?.cardId,
				providerId: payment.providerId,
				status: payment.status,
			},
		});
	}
}
