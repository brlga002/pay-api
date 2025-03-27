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

export type BraintreeCreateChargeRequest = {
	amount: number;
	currency: string;
	statementDescriptor: string;
	paymentType: "card";
	card: {
		number: string;
		holder: string;
		cvv: string;
		expiration: string;
		installmentNumber: number;
	};
};

interface TransactionResponse {
	id: string;
	date: string;
	status: "paid" | "failed" | "voided";
	amount: number;
	originalAmount: number;
	currency: string;
	statementDescriptor: string;
	paymentType: "card";
	cardId: string;
}

@Injectable()
export class BraintreeService implements PaymentProviderInterface {
	private readonly logger = new Logger(BraintreeService.name);
	readonly providerName = "braintree";
	private readonly baseUrl!: string;

	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService,
		private readonly requestContext: RequestContextService,
	) {
		const port = this.configService.get<string>("PORT", "3000");
		this.baseUrl = this.configService.get<string>(
			"PROVIDER_2_URL",
			`http://localhost:${port}/mock/provider2`,
		);
	}

	async createCharge(data: Charge): Promise<PaymentProviderResponse> {
		this.logger.log(data, `Processing charge ${data.id}`);
		if (!data.paymentSource?.card) throw new Error("Invalid payment source");
		const [month, year] = data.paymentSource.card.expirationDate.split("/");
		const expirationFormatted = `${month}/${year.slice(-2)}`;

		const response = await firstValueFrom<TransactionResponse>(
			this.httpService
				.post<string, BraintreeCreateChargeRequest>(
					`${this.baseUrl}/transactions`,
					{
						amount: data.amount,
						currency: "BRL",
						statementDescriptor: data.description,
						paymentType: "card",
						card: {
							number: data.paymentSource?.card.number,
							holder: data.paymentSource?.card.holderName,
							cvv: data.paymentSource?.card.cvv,
							expiration: expirationFormatted,
							installmentNumber: data.paymentMethod.installments,
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

	async refundCharge(
		id: string,
		amount: number,
	): Promise<{ success: boolean }> {
		await firstValueFrom<BraintreeCreateChargeRequest>(
			this.httpService
				.post<string, { amount: number }>(
					`${this.baseUrl}/void/${id}`,
					{ amount },
					{ headers: { "request-id": this.requestContext.getRequestId() } },
				)
				.pipe(
					map((response: AxiosResponse) => response.data),
					catchError((error) => {
						this.logger.error(error, "Error refunding charge");
						throw error;
					}),
				),
		);
		return { success: true };
	}
}
