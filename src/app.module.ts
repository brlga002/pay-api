import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { RequestIdInterceptor } from "./infra/logger/request-id.interceptor";
import { RequestContextService } from "./infra/logger/request-context.service";
import { AppService } from "./app.service";
import { MockProvider1Controller } from "@infra/controllers/mock-provider1.controller";
import { MockProvider2Controller } from "@infra/controllers/mock-provider2.controller";

@Module({
	controllers: [MockProvider1Controller, MockProvider2Controller],
	providers: [
		AppService,
		RequestContextService,
		{
			provide: APP_INTERCEPTOR,
			useClass: RequestIdInterceptor,
		},
	],
})
export class AppModule {}
