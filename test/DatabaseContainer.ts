import { execSync } from "node:child_process";
import { GenericContainer, StartedTestContainer } from "testcontainers";

export class DatabaseContainer {
	private container?: StartedTestContainer;

	async startContainer(): Promise<StartedTestContainer> {
		this.container = await new GenericContainer("postgres")
			.withEnvironment({
				POSTGRES_USER: "postgres",
				POSTGRES_PASSWORD: "postgres",
				POSTGRES_DB: "test",
			})
			.withExposedPorts(5432)
			.start();
		return this.container;
	}

	getUrl(): string {
		if (!this.container) {
			throw new Error("O container não foi iniciado.");
		}
		const host = this.container.getHost();
		const port = this.container.getMappedPort(5432);
		return `postgresql://postgres:postgres@${host}:${port}/test`;
	}

	createDatabase(): void {
		const url = this.getUrl();
		execSync("npx prisma db push", {
			env: {
				...process.env,
				DB_URL: url,
			},
		});
	}
}
