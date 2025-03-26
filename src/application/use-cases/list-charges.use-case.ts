import { Inject, Injectable, Logger } from "@nestjs/common";
import {
	IChargeRepository,
	ListChargesProps,
	ListChargesResponse,
} from "@domain/repositories/payment.repository";

@Injectable()
export class ListChargesUseCase {
	private readonly logger = new Logger(ListChargesUseCase.name);

	constructor(
		@Inject("IChargeRepository")
		private readonly chargeRepository: IChargeRepository,
	) {}

	async execute(props: ListChargesProps): Promise<ListChargesResponse> {
		this.logger.log(props, "Listing charges");
		const list = await this.chargeRepository.list(props);
		return list;
	}
}
