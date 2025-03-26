import { Module, Global } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { ChargePrismaRepository } from "./charge-prisma.repository";

@Global()
@Module({
	providers: [
		PrismaService,
		{
			provide: "IChargeRepository",
			useClass: ChargePrismaRepository,
		},
	],
	exports: ["IChargeRepository"],
})
export class PrismaModule {}
