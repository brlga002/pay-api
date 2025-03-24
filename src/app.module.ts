import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { RequestIdInterceptor } from "./infra/logger/request-id.interceptor";
import { RequestContextService } from "./infra/logger/request-context.service";
import { AppService } from "./app.service";

@Module({
	controllers: [],
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
