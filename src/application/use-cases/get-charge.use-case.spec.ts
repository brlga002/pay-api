import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { StartedTestContainer } from "testcontainers";
import { DatabaseContainer } from "test/DatabaseContainer";
import { PrismaService } from "@infra/prisma/prisma.service";
import { AppModule } from "../../app.module";
import { GetChargeUseCase } from "./get-charge.use-case";
import { Charge } from "@domain/entities/charge.entity";
import { Currency } from "@prisma/client";
import { PaymentStatus } from "@domain/enums/payment-status.enum";
import { PaymentType } from "@domain/enums/payment-type.enum";
import { ConfigService } from "@nestjs/config";
import { PinoLoggerService } from "@infra/logger/logger.service";
import { RequestContextService } from "@infra/logger/request-context.service";
import { MockedFallbackPaymentService } from "test/mocks/mocked-fallback-payment-service";

describe("GetChargeUseCase", () => {
	let app: INestApplication;
	let container: StartedTestContainer;
	let client: PrismaService;
	let useCase: GetChargeUseCase;
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
		useCase = app.get(GetChargeUseCase);
	}, 30000);

	afterAll(async () => {
		await app.close();
		await container.stop();
	});

	it("should return a charge when it exists", async () => {
		const logSpy = jest.spyOn(logger, "log");
		const warnSpy = jest.spyOn(logger, "warn");

		const created = await client.prismaCharge.create({
			data: {
				merchantId: "merchant-1",
				orderId: "order-1",
				amount: 100,
				currency: Currency.BRL,
				description: "Test charge",
				currentAmount: 100,
				paymentSourceType: "card",
				paymentMethod: PaymentType.CREDIT,
				status: PaymentStatus.PAID,
			},
		});

		const result = await useCase.execute(created.id);

		expect(result).toBeInstanceOf(Charge);
		expect(result?.id).toBe(created.id);
		expect(logSpy).toHaveBeenCalledWith(
			`Finding charge with id ${created.id}`,
			"GetChargeUseCase",
		);
		expect(warnSpy).not.toHaveBeenCalledWith(
			`Charge with id ${created.id} not found`,
			"GetChargeUseCase",
		);
	});

	it("should return null when charge does not exist", async () => {
		const result = await useCase.execute("non-existing-id");
		expect(result).toBeNull();
	});
});
