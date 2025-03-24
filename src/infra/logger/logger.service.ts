import { ConsoleLogger, Injectable, type LoggerService } from "@nestjs/common";
import pino from "pino";
import { RequestContextService } from "./request-context.service";

const logger = pino({
	nestedKey: "payload",
	transport: {
		target: "pino-pretty",
		options: {
			singleLine: true,
			colorize: true,
			translateTime: "SYS:mm-dd-yyyy hh:mm:ss TT",
			ignore: "pid,hostname",
		},
	},
});

@Injectable()
export class PinoLoggerService extends ConsoleLogger implements LoggerService {
	constructor(private readonly requestContext: RequestContextService) {
		super();
	}

	private getLogger(context?: string): pino.Logger {
		const requestId = this.requestContext.getRequestId();
		if (requestId) {
			return logger.child({
				name: context ? `${requestId}:${context}` : requestId,
			});
		}
		return logger;
	}

	log(obj: unknown, msg?: string, context?: string) {
		this.getLogger(context).info(obj, msg);
	}

	error(obj: unknown, msg?: string, context?: string) {
		this.getLogger(context).error(obj, msg);
	}

	warn(obj: unknown, msg?: string, context?: string) {
		this.getLogger(context).warn(obj, msg);
	}

	debug(obj: unknown, msg?: string, context?: string) {
		this.getLogger(context).debug(obj, msg);
	}

	verbose(obj: unknown, msg?: string, context?: string) {
		this.getLogger(context).trace(obj, msg);
	}
}
