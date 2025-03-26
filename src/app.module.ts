import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { CreateChargeUseCase } from "@application/use-cases/create-charge.use-case";
import { ListChargesUseCase } from "@application/use-cases/list-charges.use-case";
import { GetChargeUseCase } from "@application/use-cases/get-charge.use-case";
import { RequestIdInterceptor } from "@infra/logger/request-id.interceptor";
import { RequestContextService } from "@infra/logger/request-context.service";
import { ChargeController } from "@infra/controllers/charge.controller";
import { FallbackPaymentService } from "@infra/providers/fallback-payment.service";
import { StripeService } from "@infra/providers/stripe.service";
import { PrismaModule } from "@infra/prisma/prisma.module";
import { MockModule } from "@infra/mock-providers/mock.module";
import { BraintreeService } from "@infra/providers/braintree.service";
import { RefundController } from "@infra/controllers/refund.controller";
import { AppService } from "./app.service";
import { RefundUseCase } from "@application/use-cases/refund.use-case";

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		HttpModule,
		PrismaModule,
		MockModule,
	],
	controllers: [ChargeController, RefundController],
	providers: [
		AppService,
		RequestContextService,
		StripeService,
		BraintreeService,
		CreateChargeUseCase,
		ListChargesUseCase,
		GetChargeUseCase,
		RefundUseCase,
		{
			provide: APP_INTERCEPTOR,
			useClass: RequestIdInterceptor,
		},
		{
			provide: "IFallbackPaymentService",
			useFactory: (stripe: StripeService, braintree: BraintreeService) =>
				new FallbackPaymentService([stripe, braintree]),
			inject: [StripeService, BraintreeService],
		},
	],
})
export class AppModule {}
