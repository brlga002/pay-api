import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";

type Store = Map<string, unknown>;

@Injectable()
export class RequestContextService {
	private readonly asyncLocalStorage = new AsyncLocalStorage<Store>();

	run<T>(fn: () => T | Promise<T>): T | Promise<T> {
		const store = new Map<string, unknown>();
		return this.asyncLocalStorage.run(store, fn);
	}

	getRequestId(): string {
		return this.get<string>("requestId") ?? "";
	}

	setRequestId(value: string): void {
		this.set("requestId", value);
	}

	private get<T>(key: string): T | undefined {
		return this.asyncLocalStorage.getStore()?.get(key) as T | undefined;
	}

	private set<T>(key: string, value: T): void {
		this.asyncLocalStorage.getStore()?.set(key, value);
	}
}
