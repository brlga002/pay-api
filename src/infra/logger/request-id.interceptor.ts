import {
	Injectable,
	type NestInterceptor,
	type ExecutionContext,
	type CallHandler,
} from "@nestjs/common";
import { RequestContextService } from "./request-context.service";
import { Observable } from "rxjs";
import { randomUUID } from "node:crypto";

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
	constructor(private readonly requestContextService: RequestContextService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		return new Observable((subscriber) => {
			this.requestContextService.run(() => {
				const contextType = context.getType<"http" | "rmq">();

				if (contextType === "rmq") {
					const rpcContext = context.switchToRpc().getContext();
					const requestId =
						rpcContext?.properties?.headers?.["request-id"] ?? randomUUID();
					this.requestContextService.setRequestId(requestId);
					rpcContext.properties.headers["request-id"] = requestId;
				}

				if (contextType === "http") {
					const requestId = randomUUID();
					this.requestContextService.setRequestId(requestId);
				}

				next.handle().subscribe({
					next: (value) => subscriber.next(value),
					error: (err) => subscriber.error(err),
					complete: () => subscriber.complete(),
				});
			});
		});
	}
}
