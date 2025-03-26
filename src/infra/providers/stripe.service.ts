import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import {
	PaymentProviderInterface,
	PaymentProviderResponse,
} from "src/domain/services/payment-provider.interface";
import { Charge } from "@domain/entities/charge.entity";
import { catchError, firstValueFrom, map } from "rxjs";
import { AxiosResponse } from "axios";
import { ConfigService } from "@nestjs/config";
import { Provider } from "@domain/entities/provider.entity";
import { RequestContextService } from "@infra/logger/request-context.service";

export type StripeCreateChargeRequest = {
	amount: number;
	currency: "BRL";
	description: string;
	paymentMethod: {
		type: "card";
		card: {
			number: string;
			holderName: string;
			cvv: string;
			expirationDate: string;
			installments: number;
		};
	};
};

interface ChargeResponse {
	id: string;
	createdAt: string;
	status: "authorized" | "failed" | "refunded";
	originalAmount: number;
	currentAmount: number;
	currency: string;
	description: string;
	paymentMethod: "card";
	cardId: string;
}

@Injectable()
export class StripeService implements PaymentProviderInterface {
	private readonly logger = new Logger(StripeService.name);
	readonly name = "stripe";
	private readonly baseUrl!: string;

	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService,
		private readonly requestContext: RequestContextService,
	) {
		this.baseUrl = this.configService.get<string>(
			"STRIPE_BASE_URL",
			"http://localhost:3000/mock/provider1",
		);
	}

	async createCharge(data: Charge): Promise<PaymentProviderResponse> {
		this.logger.log(data, `Processing charge ${data.id}`);
		if (!data.paymentSource?.card) throw new Error("Invalid payment source");

		const response = await firstValueFrom<ChargeResponse>(
			this.httpService
				.post<string, StripeCreateChargeRequest>(
					`${this.baseUrl}/charges`,
					{
						amount: data.amount,
						currency: "BRL",
						description: data.description,
						paymentMethod: {
							type: "card",
							card: {
								number: data.paymentSource?.card.number,
								holderName: data.paymentSource?.card.holderName,
								cvv: data.paymentSource?.card.cvv,
								expirationDate: data.paymentSource?.card.expirationDate,
								installments: data.paymentMethod.installments,
							},
						},
					},
					{ headers: { "request-id": this.requestContext.getRequestId() } },
				)
				.pipe(
					map((response: AxiosResponse) => response.data),
					catchError((error) => {
						this.logger.error(error, "Error creating charge");
						throw error;
					}),
				),
		);
		return {
			provider: new Provider(response.id, "stripe"),
			status: response.status,
			cardId: response.cardId,
		};
	}
}
