import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { StartedTestContainer } from "testcontainers";
import { ConfigService } from "@nestjs/config";
import { DatabaseContainer } from "test/DatabaseContainer";
import { PrismaService } from "@infra/prisma/prisma.service";
import { AppModule } from "../../app.module";
import * as request from "supertest";
import { Currency } from "@domain/enums/currency.enum";
import { PaymentType } from "@domain/enums/payment-type.enum";
import { PaymentStatus } from "@domain/enums/payment-status.enum";
import { v4 as uuidv4 } from "uuid";
import { IFallbackPaymentService } from "@domain/services/fallback-payment.service";

describe("RefundController", () => {
	let app: INestApplication;
	let container: StartedTestContainer;
	let client: PrismaService;
	let fallbackService: IFallbackPaymentService;

	beforeAll(async () => {
		const databaseContainer = new DatabaseContainer();
		container = await databaseContainer.startContainer();
		databaseContainer.createDatabase();

		const module = await Test.createTestingModule({
			imports: [AppModule],
		})
			.overrideProvider(ConfigService)
			.useValue(new ConfigService({ DB_URL: databaseContainer.getUrl() }))
			.compile();

		app = module.createNestApplication();
		await app.init();
		client = app.get(PrismaService);
		fallbackService = module.get<IFallbackPaymentService>(
			"IFallbackPaymentService",
		);
	}, 30000);

	afterAll(async () => {
		await app.close();
		await container.stop();
	});

	it("POST /refunds/:chargeId should refund a charge", async () => {
		jest
			.spyOn(fallbackService, "refundPayment")
			.mockResolvedValue({ success: true });

		const charge = await client.prismaCharge.create({
			data: {
				id: uuidv4(),
				merchantId: "merchant-1",
				orderId: "order-1",
				amount: 1000,
				currentAmount: 1000,
				currency: Currency.BRL,
				description: "to refund",
				paymentSourceType: "card",
				paymentMethod: PaymentType.CREDIT,
				paymentSourceId: "card-id",
				status: PaymentStatus.PAID,
				providerId: "provider-1",
				providerName: "mock",
			},
		});

		return request(app.getHttpServer())
			.post(`/refunds/${charge.id}`)
			.send({ amount: 500 })
			.expect(201)
			.expect(({ body }) => {
				expect(body).toBeDefined();
				expect(body.id).toBe(charge.id);
				expect(body.currentAmount).toBe(500);
				expect(body.status).toBe("refunded");
			});
	});

	it("POST /refunds/:chargeId should return 400 for invalid body", () => {
		const nonExistentId = uuidv4();
		return request(app.getHttpServer())
			.post(`/refunds/${nonExistentId}`)
			.send({})
			.expect(400);
	});

	it("POST /refunds/:chargeId should return 404 if charge does not exist", () => {
		return request(app.getHttpServer())
			.post(`/refunds/${uuidv4()}`)
			.send({ amount: 100 })
			.expect(404);
	});

	it("POST /refunds/:chargeId should not refund if not allowed", async () => {
		const charge = await client.prismaCharge.create({
			data: {
				id: uuidv4(),
				merchantId: "merchant-2",
				orderId: "order-2",
				amount: 1000,
				currentAmount: 0,
				currency: Currency.BRL,
				description: "already refunded",
				paymentSourceType: "card",
				paymentMethod: PaymentType.CREDIT,
				paymentSourceId: "card-id",
				status: PaymentStatus.REFUNDED,
				providerId: "provider-1",
				providerName: "mock",
			},
		});

		return request(app.getHttpServer())
			.post(`/refunds/${charge.id}`)
			.send({ amount: 100 })
			.expect(201)
			.expect(({ body }) => {
				expect(body.currentAmount).toBe(0);
				expect(body.status).toBe("refunded");
			});
	});
});
