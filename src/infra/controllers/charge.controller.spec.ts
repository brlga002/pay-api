import { type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { StartedTestContainer } from "testcontainers";
import { ConfigService } from "@nestjs/config";
import { DatabaseContainer } from "test/DatabaseContainer";
import { PrismaService } from "@infra/prisma/prisma.service";
import { AppModule } from "../../app.module";
import { IFallbackPaymentService } from "@domain/services/fallback-payment.service";
import { RequestContextService } from "@infra/logger/request-context.service";
import { PinoLoggerService } from "@infra/logger/logger.service";
import { MockedFallbackPaymentService } from "test/mocks/mocked-fallback-payment-service";
import * as request from "supertest";
import { Provider } from "@domain/entities/provider.entity";
import { CreateChargeSchema } from "./dto/create-charge.dto";
import { Currency } from "@domain/enums/currency.enum";
import { PaymentType } from "@domain/enums/payment-type.enum";
import { PaymentStatus } from "@domain/enums/payment-status.enum";

describe("ChargeController", () => {
	let app: INestApplication;
	let container: StartedTestContainer;
	let client!: PrismaService;
	let fallbackService: IFallbackPaymentService;
	const logger: PinoLoggerService = new PinoLoggerService(
		new RequestContextService(),
	);

	beforeAll(async () => {
		const databaseContainer = new DatabaseContainer();
		container = await databaseContainer.startContainer();
		databaseContainer.createDatabase();

		const module = await Test.createTestingModule({
			imports: [AppModule],
			providers: [
				{
					provide: "IFallbackPaymentService",
					useValue: {
						processPayment: jest.fn(),
					},
				},
			],
		})
			.overrideProvider(ConfigService)
			.useValue(new ConfigService({ DB_URL: databaseContainer.getUrl() }))
			.overrideProvider("IFallbackPaymentService")
			.useValue(new MockedFallbackPaymentService())
			.setLogger(logger)
			.compile();

		app = module.createNestApplication();
		await app.init();
		client = app.get(PrismaService);
		fallbackService = module.get<IFallbackPaymentService>(
			"IFallbackPaymentService",
		);
	});

	afterAll(async () => {
		await app.close();
		await container.stop();
	});

	it("should  not create a charge with invalid input", () => {
		const invalidInput = {};
		const resultCreate = CreateChargeSchema.safeParse(invalidInput);

		expect(resultCreate.success).toBe(false);
	});

	it("POST /charges should create a charge", () => {
		jest.spyOn(fallbackService, "processPayment").mockResolvedValue({
			provider: new Provider("provider1", "some-provider"),
			cardId: "card-id",
			status: "paid",
		});

		return request(app.getHttpServer())
			.post("/charges")
			.send({
				merchantId: "1323",
				orderId: "456789",
				amount: 1500,
				currency: "BRL",
				description: "some description",
				paymentMethod: {
					type: "credit",
					installments: 1,
					card: {
						number: "4000000000009995",
						holderName: "Erro",
						cvv: "123",
						expirationDate: "12/2025",
					},
				},
			})
			.expect(201)
			.expect(({ body }) => {
				expect(body).toBeDefined();
				expect(body.id).toBeDefined();
				expect(body.merchantId).toBe("1323");
				expect(body.orderId).toBe("456789");
				expect(body.amount).toBe(1500);
				expect(body.currency).toBe("BRL");
				expect(body.description).toBe("some description");
				expect(body.status).toBe("paid");
				expect(body.paymentMethod).toMatchObject({
					paymentType: "credit",
					installments: 1,
				});
				expect(body.providerId).toBe("provider1");
				expect(body.providerName).toBe("some-provider");
				expect(body.currentAmount).toBe(1500);
				expect(body.paymentSource).toMatchObject({
					id: "card-id",
					sourceType: "card",
				});
				expect(body.createdAt).toBeDefined();
			});
	});

	it("GET /charges/:id should return the charge", async () => {
		const charge = await client.prismaCharge.create({
			select: { id: true },
			data: {
				id: "3c0c8265-e53a-4c9a-a0a1-b67fed032d54",
				merchantId: "merchant-1",
				amount: 100,
				currency: Currency.BRL,
				description: "some description",
				currentAmount: 50,
				paymentSourceType: "card",
				paymentMethod: PaymentType.CREDIT,
				paymentSourceId: "card-id",
				orderId: "some-order-id",
				status: PaymentStatus.REFUNDED,
				providerId: "provider1",
				providerName: "some-provider",
			},
		});

		return request(app.getHttpServer())
			.get(`/charges/${charge?.id}`)
			.expect(200)
			.expect(({ body }) => {
				expect(body).toBeDefined();
				expect(body.id).toBeDefined();
				expect(body.merchantId).toBe("merchant-1");
				expect(body.orderId).toBe("some-order-id");
				expect(body.amount).toBe(100);
				expect(body.currency).toBe("BRL");
				expect(body.description).toBe("some description");
				expect(body.status).toBe("refunded");
				expect(body.paymentMethod).toMatchObject({
					paymentType: "credit",
					installments: 1,
				});
				expect(body.providerId).toBe("provider1");
				expect(body.providerName).toBe("some-provider");
				expect(body.currentAmount).toBe(50);
				expect(body.paymentSource).toMatchObject({
					id: "card-id",
					sourceType: "card",
				});
				expect(body.createdAt).toBeDefined();
			});
	});

	it("GET /charges should return a list of charges", async () => {
		return request(app.getHttpServer())
			.get("/charges")
			.query({ merchantId: "merchant-1" })
			.expect(200)
			.expect(({ body }) => {
				expect(body).toBeDefined();
				expect(body.meta).toBeDefined();
				expect(body.items).toBeDefined();
				expect(body.items.length).toBe(1);
			});
	});
});
