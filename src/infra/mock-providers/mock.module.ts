import { Module, Global } from "@nestjs/common";
import { MockProvider1Controller } from "./mock-provider1.controller";
import { MockProvider2Controller } from "./mock-provider2.controller";

@Global()
@Module({
	controllers: [MockProvider1Controller, MockProvider2Controller],
})
export class MockModule {}
