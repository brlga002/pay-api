import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { RequestIdInterceptor } from "./infra/logger/request-id.interceptor";
import { RequestContextService } from "./infra/logger/request-context.service";
import { AppService } from "./app.service";
import { ChargeController } from "@infra/controllers/charge.controller";
import { ConfigModule } from "@nestjs/config";
import { FallbackPaymentService } from "@infra/providers/fallback-payment.service";
import { StripeService } from "@infra/providers/stripe.service";
import { HttpModule } from "@nestjs/axios";
import { CreateChargeUseCase } from "@application/use-cases/create-charge.use-case";
import { PrismaModule } from "@infra/prisma/prisma.module";
import { MockModule } from "@infra/mock-providers/mock.module";
import { BraintreeService } from "@infra/providers/braintree.service";
import { ListChargesUseCase } from "@application/use-cases/list-charges.use-case";

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		HttpModule,
		PrismaModule,
		MockModule,
	],
	controllers: [ChargeController],
	providers: [
		AppService,
		RequestContextService,
		StripeService,
		BraintreeService,
		CreateChargeUseCase,
		ListChargesUseCase,
		{
			provide: APP_INTERCEPTOR,
			useClass: RequestIdInterceptor,
		},
		{
			provide: FallbackPaymentService,
			useFactory: (stripe: StripeService, braintree: BraintreeService) =>
				new FallbackPaymentService([stripe, braintree]),
			inject: [StripeService, BraintreeService],
		},
	],
})
export class AppModule {}
