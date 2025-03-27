import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { StartedTestContainer } from "testcontainers";
import { DatabaseContainer } from "test/DatabaseContainer";
import { PrismaService } from "@infra/prisma/prisma.service";
import { AppModule } from "../../app.module";
import { RefundUseCase } from "./refund.use-case";
import { Currency } from "@prisma/client";
import { PaymentStatus } from "@domain/enums/payment-status.enum";
import { PaymentType } from "@domain/enums/payment-type.enum";
import { ConfigService } from "@nestjs/config";
import { PinoLoggerService } from "@infra/logger/logger.service";
import { RequestContextService } from "@infra/logger/request-context.service";
import { MockedFallbackPaymentService } from "test/mocks/mocked-fallback-payment-service";
import { IFallbackPaymentService } from "@domain/services/fallback-payment.service";
import { IChargeRepository } from "@domain/repositories/payment.repository";

describe("RefundUseCase", () => {
	let app: INestApplication;
	let container: StartedTestContainer;
	let client: PrismaService;
	let useCase: RefundUseCase;
	let fallbackService: IFallbackPaymentService;
	let chargeRepository: IChargeRepository;
	const logger: PinoLoggerService = new PinoLoggerService(
		new RequestContextService(),
	);

	beforeAll(async () => {
		const databaseContainer = new DatabaseContainer();
		container = await databaseContainer.startContainer();
		databaseContainer.createDatabase();

		const module = await Test.createTestingModule({
			imports: [AppModule],
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
		useCase = app.get(RefundUseCase);
		fallbackService = module.get<IFallbackPaymentService>(
			"IFallbackPaymentService",
		);
		chargeRepository = module.get<IChargeRepository>("IChargeRepository");
	});

	afterAll(async () => {
		await app.close();
		await container.stop();
	});

	it("should refund a charge when allowed", async () => {
		jest
			.spyOn(fallbackService, "refundPayment")
			.mockResolvedValue({ success: true });

		const charge = await client.prismaCharge.create({
			data: {
				merchantId: "merchant-1",
				orderId: "order-1",
				amount: 1000,
				currentAmount: 1000,
				currency: Currency.BRL,
				paymentSourceType: "card",
				paymentMethod: PaymentType.CREDIT,
				status: PaymentStatus.PAID,
				description: "Charge description",
				providerId: "some-provider-id",
				providerName: "some-provider-name",
			},
		});

		const result = await useCase.execute(charge.id, 500);

		expect(result?.amount).toBe(1000);
		expect(result?.currentAmount).toBe(500);
		expect(result?.status).toBe("refunded");
	});

	it("should not refund a charge if refund fails", async () => {
		const updateChargeRepositorySpy = jest.spyOn(chargeRepository, "update");
		jest
			.spyOn(fallbackService, "refundPayment")
			.mockResolvedValue({ success: false });
		const logSpy = jest.spyOn(logger, "log");

		const charge = await client.prismaCharge.create({
			data: {
				merchantId: "merchant-1",
				orderId: "order-2",
				amount: 1000,
				currentAmount: 1000,
				currency: Currency.BRL,
				paymentSourceType: "card",
				paymentMethod: PaymentType.CREDIT,
				status: PaymentStatus.PAID,
				description: "Charge description",
				providerId: "some-provider-id",
				providerName: "some-provider-name",
			},
		});

		const result = await useCase.execute(charge.id, 500);

		expect(result?.amount).toBe(1000);
		expect(result?.currentAmount).toBe(1000);
		expect(result?.status).toBe("paid");
		expect(logSpy).toHaveBeenNthCalledWith(
			3,
			`Refund failed for charge with id ${charge.id}. Cancelling refund`,
			"RefundUseCase",
		);
		expect(updateChargeRepositorySpy).toHaveBeenCalledTimes(2);
	});

	it("should not refund a charge if not found", async () => {
		const warnSpy = jest.spyOn(logger, "warn");

		const result = await useCase.execute("not-found-id", 500);

		expect(result).toBeFalsy();
		expect(warnSpy).toHaveBeenCalledWith(
			"Charge with id not-found-id not found",
			"RefundUseCase",
		);
	});

	it("should not refund a charge if not allowed", async () => {
		const charge = await client.prismaCharge.create({
			data: {
				merchantId: "merchant-2",
				orderId: "order-2",
				amount: 1000,
				currentAmount: 0,
				currency: Currency.BRL,
				paymentSourceType: "card",
				paymentMethod: PaymentType.CREDIT,
				status: PaymentStatus.REFUNDED,
				description: "Charge description",
			},
		});

		const result = await useCase.execute(charge.id, 500);

		expect(result?.amount).toBe(1000);
		expect(result?.currentAmount).toBe(0);
	});
});
