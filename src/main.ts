import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { PinoLoggerService } from "@infra/logger/logger.service";
import { RequestContextService } from "@infra/logger/request-context.service";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true,
	});
	const requestContext = app.get(RequestContextService);
	const logger = new PinoLoggerService(requestContext);
	app.useLogger(logger);
	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
