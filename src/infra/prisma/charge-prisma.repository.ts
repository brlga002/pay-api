import { Injectable } from "@nestjs/common";

import {
	IChargeRepository,
	ListChargesProps,
	ListChargesResponse,
} from "src/domain/repositories/payment.repository";
import { Charge } from "@domain/entities/charge.entity";
import { PrismaService } from "./prisma.service";
import { Credit } from "@domain/entities/credt.entity";

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
			paymentMethod: new Credit({
				installments: 1,
			}),
			paymentSource: {
				...(payment.paymentSourceId && { id: payment.paymentSourceId }),
				sourceType: payment.paymentSourceType,
			},
		});
	}

	async save(payment: Charge): Promise<void> {
		const paymentMethod = payment.paymentMethod.toJSON();
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
				paymentMethodInstallments: paymentMethod.installments,
				paymentSourceType: payment.paymentSource.sourceType,
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
				paymentSourceId: payment.paymentSource?.id,
				providerId: payment.providerId,
				status: payment.status,
			},
		});
	}

	async list(props: ListChargesProps): Promise<ListChargesResponse> {
		const { page, limit, sort, merchantId, orderId } = props;
		const where = {
			...(merchantId && { merchantId: merchantId }),
			...(orderId && { orderId: orderId }),
		};
		const totalItems = await this.client.prismaCharge.count({ where });

		if (totalItems === 0) {
			return {
				meta: {
					itemCount: 0,
					totalItems: 0,
					itemsPerPage: limit,
					totalPages: 0,
					currentPage: page,
				},
				items: [],
			};
		}

		const payments = await this.client.prismaCharge.findMany({
			where,
			take: limit,
			skip: (page - 1) * limit,
			orderBy: {
				createdAt: sort,
			},
		});

		const items = payments.map((payment) =>
			Charge.create({
				...payment,
				paymentMethod: new Credit({
					installments: payment.paymentMethodInstallments || 1,
				}),
				paymentSource: {
					...(payment.paymentSourceId && { id: payment.paymentSourceId }),
					sourceType: payment.paymentSourceType,
				},
			}),
		);

		const pages = Math.ceil(totalItems / limit);

		return {
			meta: {
				itemCount: items.length,
				totalItems,
				itemsPerPage: limit,
				totalPages: pages,
				currentPage: page,
			},
			items: items,
		};
	}

	async findById(chargeId: string): Promise<Charge | null> {
		const payment = await this.client.prismaCharge.findUnique({
			where: {
				id: chargeId,
			},
		});
		if (!payment) return null;

		return Charge.create({
			...payment,
			paymentMethod: new Credit({
				installments: payment.paymentMethodInstallments || 1,
			}),
			paymentSource: {
				...(payment.paymentSourceId && { id: payment.paymentSourceId }),
				sourceType: payment.paymentSourceType,
			},
		});
	}
}
