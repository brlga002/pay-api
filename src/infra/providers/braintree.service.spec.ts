import { type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../app.module";
import { BraintreeService } from "./braintree.service";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { RequestContextService } from "@infra/logger/request-context.service";
import { of, throwError } from "rxjs";
import { AxiosResponse } from "axios";
import { Charge } from "@domain/entities/charge.entity";
import { Credit } from "@domain/entities/credt.entity";
import { Card } from "@domain/entities/card.entity";
import { PinoLoggerService } from "@infra/logger/logger.service";
import { DatabaseContainer } from "test/DatabaseContainer";
import { StartedTestContainer } from "testcontainers";

describe("BraintreeService", () => {
	let app: INestApplication;
	let container: StartedTestContainer;
	let service: BraintreeService;
	let httpService: HttpService;
	let configService: ConfigService;
	let requestContext: RequestContextService;
	const logger: PinoLoggerService = new PinoLoggerService(
		new RequestContextService(),
	);

	beforeAll(async () => {
		const databaseContainer = new DatabaseContainer();
		container = await databaseContainer.startContainer();
		databaseContainer.createDatabase();

		httpService = mockHttpService as unknown as HttpService;
		configService = mockConfigService as unknown as ConfigService;
		requestContext = mockRequestContext as unknown as RequestContextService;

		const module = await Test.createTestingModule({
			imports: [AppModule],
			providers: [],
		})
			.overrideProvider(ConfigService)
			.useValue(new ConfigService({ DB_URL: databaseContainer.getUrl() }))
			.overrideProvider(BraintreeService)
			.useValue(
				new BraintreeService(httpService, configService, requestContext),
			)
			.setLogger(logger)
			.compile();

		app = module.createNestApplication();
		await app.init();
		service = app.get(BraintreeService);
	}, 30000);

	afterAll(async () => {
		await app.close();
		await container.stop();
	});

	const mockHttpService = {
		post: jest.fn(),
	};

	const mockConfigService = {
		get: jest.fn().mockReturnValue("3001"),
	};

	const mockRequestContext = {
		getRequestId: jest.fn().mockReturnValue("req-id-123"),
	};

	it("should create a charge successfully", async () => {
		const charge = {
			id: "charge-1",
			amount: 1000,
			description: "Test charge",
			paymentMethod: new Credit({ installments: 2 }),
			paymentSource: {
				card: new Card({
					number: "4111111111111111",
					holderName: "Gabriel",
					cvv: "123",
					expirationDate: "12/2025",
				}),
			},
		} as Charge;

		const mockResponse: AxiosResponse = {
			data: {
				id: "braintree-123",
				createdAt: new Date().toISOString(),
				status: "authorized",
				originalAmount: 1000,
				currentAmount: 1000,
				currency: "BRL",
				description: "Test charge",
				paymentMethod: "card",
				cardId: "card-abc",
			},
			status: 200,
			statusText: "OK",
		} as AxiosResponse;

		mockHttpService.post.mockReturnValue(of(mockResponse));

		const result = await service.createCharge(charge);

		expect(result.status).toBe("authorized");
		expect(result.provider.id).toBe("braintree-123");
		expect(result.cardId).toBe("card-abc");
	});

	it("should throw if no card in payment source", async () => {
		const charge = {
			id: "charge-2",
			amount: 1000,
			description: "Test charge",
			paymentMethod: new Credit({ installments: 2 }),
			paymentSource: {},
		} as Charge;

		await expect(service.createCharge(charge)).rejects.toThrow(
			"Invalid payment source",
		);
	});

	it("should throw if createCharge HTTP call fails", async () => {
		const charge = {
			id: "charge-3",
			amount: 1000,
			description: "Test",
			paymentMethod: new Credit({ installments: 1 }),
			paymentSource: {
				card: new Card({
					number: "4111111111111111",
					holderName: "Gabriel",
					cvv: "123",
					expirationDate: "12/2025",
				}),
			},
		} as Charge;

		mockHttpService.post.mockReturnValue(
			throwError(() => new Error("HTTP error")),
		);

		await expect(service.createCharge(charge)).rejects.toThrow("HTTP error");
	});

	it("should refund successfully", async () => {
		const mockRefundResponse: AxiosResponse = {
			data: {
				success: true,
			},
			status: 200,
			statusText: "OK",
		} as AxiosResponse;

		mockHttpService.post.mockReturnValue(of(mockRefundResponse));

		const result = await service.refundCharge("braintree-123", 500);

		expect(result).toEqual({ success: true });
	});

	it("should throw if refund HTTP call fails", async () => {
		mockHttpService.post.mockReturnValue(
			throwError(() => new Error("Refund failed")),
		);

		await expect(service.refundCharge("braintree-123", 500)).rejects.toThrow(
			"Refund failed",
		);
	});
});
