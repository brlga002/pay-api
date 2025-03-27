import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { StartedTestContainer } from "testcontainers";
import { DatabaseContainer } from "test/DatabaseContainer";
import { PrismaService } from "@infra/prisma/prisma.service";
import { AppModule } from "../../app.module";
import { ListChargesUseCase } from "./list-charges.use-case";
import { Currency } from "@prisma/client";
import { PaymentStatus } from "@domain/enums/payment-status.enum";
import { PaymentType } from "@domain/enums/payment-type.enum";
import { ConfigService } from "@nestjs/config";
import { MockedFallbackPaymentService } from "test/mocks/mocked-fallback-payment-service";

describe("ListChargesUseCase", () => {
	let app: INestApplication;
	let container: StartedTestContainer;
	let client: PrismaService;
	let useCase: ListChargesUseCase;

	beforeAll(async () => {
		const databaseContainer = new DatabaseContainer();
		container = await databaseContainer.startContainer();
		databaseContainer.createDatabase();

		const module = await Test.createTestingModule({
			imports: [AppModule],
			providers: [],
		})
			.overrideProvider(ConfigService)
			.useValue(new ConfigService({ DB_URL: databaseContainer.getUrl() }))
			.overrideProvider("IFallbackPaymentService")
			.useValue(new MockedFallbackPaymentService())
			.compile();

		app = module.createNestApplication();
		await app.init();

		client = app.get(PrismaService);
		useCase = app.get(ListChargesUseCase);

		const input = {
			currency: Currency.BRL,
			paymentSourceType: "card",
			paymentMethod: PaymentType.CREDIT,
			description: "Test charge",
		};
		await client.prismaCharge.createMany({
			data: [
				{
					...input,
					merchantId: "merchant-1",
					orderId: "order-1",
					amount: 100,
					currentAmount: 100,
					status: PaymentStatus.PAID,
					createdAt: "2025-03-20T00:00:00.000Z",
				},
				{
					...input,
					merchantId: "merchant-1",
					orderId: "order-2",
					amount: 100,
					currentAmount: 100,
					status: PaymentStatus.FAILED,
					createdAt: "2025-03-21T00:00:00.000Z",
				},
				{
					...input,
					merchantId: "merchant-1",
					orderId: "order-3",
					amount: 100,
					currentAmount: 100,
					status: PaymentStatus.REFUNDED,
					createdAt: "2025-03-27T00:00:00.000Z",
				},
				{
					...input,
					merchantId: "merchant-2",
					orderId: "order-2235",
					amount: 200,
					currentAmount: 200,
					status: PaymentStatus.PAID,
				},
			],
		});
	}, 30000);

	afterAll(async () => {
		await app.close();
		await container.stop();
	});

	it("should return a first page of charges sorted by creation date in descending order", async () => {
		const result = await useCase.execute({
			merchantId: "merchant-1",
			page: 1,
			limit: 2,
			sort: "desc",
		});

		expect(result.meta).toEqual({
			itemCount: 2,
			totalItems: 3,
			itemsPerPage: 2,
			totalPages: 2,
			currentPage: 1,
		});
		expect(
			result.items.every((i) => i.merchantId === "merchant-1"),
		).toBeTruthy();
		expect(result.items[0].orderId === "order-3").toBeTruthy();
		expect(result.items[1].orderId === "order-2").toBeTruthy();
	});

	it("should return a second page of charges sorted by creation date in ascending order", async () => {
		const result = await useCase.execute({
			merchantId: "merchant-1",
			page: 2,
			limit: 2,
			sort: "asc",
		});

		expect(result.meta).toEqual({
			itemCount: 1,
			totalItems: 3,
			itemsPerPage: 2,
			totalPages: 2,
			currentPage: 2,
		});
		expect(
			result.items.every((i) => i.merchantId === "merchant-1"),
		).toBeTruthy();
		expect(result.items[0].orderId === "order-3").toBeTruthy();
	});

	it("should return a second page of charges sorted by creation date in ascending order", async () => {
		const result = await useCase.execute({
			merchantId: "no-existed-merchant",
			page: 1,
			limit: 2,
			sort: "asc",
		});

		expect(result).toEqual({
			meta: {
				itemCount: 0,
				totalItems: 0,
				itemsPerPage: 2,
				totalPages: 0,
				currentPage: 1,
			},
			items: [],
		});
	});
});
