import { type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { StartedTestContainer } from "testcontainers";
import { ConfigService } from "@nestjs/config";
import { DatabaseContainer } from "test/DatabaseContainer";
import { PrismaService } from "@infra/prisma/prisma.service";
import { CreateChargeUseCase } from "@application/use-cases/create-charge.use-case";
import { Charge } from "@domain/entities/charge.entity";
import { PaymentStatus } from "@domain/enums/payment-status.enum";
import { AppModule } from "../../app.module";
import { IFallbackPaymentService } from "@domain/services/fallback-payment.service";
import { Provider } from "@domain/entities/provider.entity";
import { RequestContextService } from "@infra/logger/request-context.service";
import { PinoLoggerService } from "@infra/logger/logger.service";
import { IChargeRepository } from "@domain/repositories/payment.repository";
import { Currency } from "@prisma/client";
import { PaymentType } from "@domain/enums/payment-type.enum";
import { MockedFallbackPaymentService } from "test/mocks/mocked-fallback-payment-service";
import { createMockCharge } from "test/mocks/create-mock-charge";

describe("CreateChargeUseCase", () => {
	let app: INestApplication;
	let container: StartedTestContainer;
	let prismaClient!: PrismaService;
	let useCase: CreateChargeUseCase;
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
		prismaClient = app.get(PrismaService);
		useCase = module.get(CreateChargeUseCase);
		fallbackService = module.get<IFallbackPaymentService>(
			"IFallbackPaymentService",
		);
		chargeRepository = module.get<IChargeRepository>("IChargeRepository");

		const input = {
			merchantId: "merchant-1",
			amount: 100,
			currency: Currency.BRL,
			description: "Test charge",
			currentAmount: 50,
			paymentSourceType: "card",
			paymentMethod: PaymentType.CREDIT,
		};
		await prismaClient.prismaCharge.createMany({
			data: [
				{
					...input,
					id: "3c0c8265-e53a-4c9a-a0a1-b67fed032d54",
					orderId: "some-refunded-order",
					status: PaymentStatus.REFUNDED,
				},
				{
					...input,
					id: "5b6289c0-28c9-4398-90c5-cd3fc0d5da62",
					orderId: "some-pending-order",
					status: PaymentStatus.PENDING,
				},
			],
		});
	}, 30000);

	afterAll(async () => {
		await app.close();
		await container.stop();
	});

	it("should create a new charge", async () => {
		const logSpy = jest.spyOn(logger, "log");
		jest.spyOn(fallbackService, "processPayment").mockResolvedValue({
			provider: new Provider("provider1", "some-provider"),
			cardId: "card-id",
			status: "paid",
		});

		const input = createMockCharge();
		const result = await useCase.execute(input);

		expect(result).toBeInstanceOf(Charge);
		expect(result.status).toBe("paid");
		expect(result.providerId).toBe("provider1");
		expect(result.providerName).toBe("some-provider");
		expect(result.paymentSource.sourceType).toBe("card");
		expect(result.paymentSource.id).toBe("card-id");
		expect(logSpy).toHaveBeenCalledWith(
			"Creating new charge charge-id",
			"CreateChargeUseCase",
		);
	});

	it("should not create a new charge if it already exists and is not ready to process", async () => {
		const input = createMockCharge({ orderId: "some-refunded-order" });
		const logSpy = jest.spyOn(logger, "log");
		const warnSpy = jest.spyOn(logger, "warn");
		const saveChargeRepositorySpy = jest.spyOn(chargeRepository, "save");
		const updateChargeRepositorySpy = jest.spyOn(chargeRepository, "update");

		const result = await useCase.execute(input);

		expect(result).toBeInstanceOf(Charge);
		expect(result.status).toBe("refunded");
		expect(logSpy).toHaveBeenCalledWith(
			"Charge 3c0c8265-e53a-4c9a-a0a1-b67fed032d54 already exists",
			"CreateChargeUseCase",
		);
		expect(warnSpy).toHaveBeenCalledWith(
			"Charge 3c0c8265-e53a-4c9a-a0a1-b67fed032d54 is not ready to process",
			"CreateChargeUseCase",
		);
		expect(saveChargeRepositorySpy).not.toHaveBeenCalled();
		expect(updateChargeRepositorySpy).not.toHaveBeenCalled();
	});

	it("should not create a new charge if it already exists and is ready to process", async () => {
		const input = createMockCharge({ orderId: "some-pending-order" });
		const logSpy = jest.spyOn(logger, "log");
		const warnSpy = jest.spyOn(logger, "warn");
		const saveChargeRepositorySpy = jest.spyOn(chargeRepository, "save");
		const updateChargeRepositorySpy = jest.spyOn(chargeRepository, "update");
		jest.spyOn(fallbackService, "processPayment").mockResolvedValue({
			provider: new Provider("provider1", "some-provider"),
			cardId: "card-id",
			status: "paid",
		});

		const result = await useCase.execute(input);

		expect(result).toBeInstanceOf(Charge);
		expect(result.status).toBe("paid");
		expect(logSpy).toHaveBeenCalledWith(
			"Charge 5b6289c0-28c9-4398-90c5-cd3fc0d5da62 already exists",
			"CreateChargeUseCase",
		);
		expect(warnSpy).not.toHaveBeenCalledWith(
			"Charge 5b6289c0-28c9-4398-90c5-cd3fc0d5da62 is not ready to process",
			"CreateChargeUseCase",
		);
		expect(saveChargeRepositorySpy).not.toHaveBeenCalled();
		expect(updateChargeRepositorySpy).toHaveBeenCalled();
	});
});
