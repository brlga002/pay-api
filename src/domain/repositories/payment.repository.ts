import { Charge } from "../entities/charge.entity";

export interface IChargeRepository {
	save(payment: Charge): Promise<void>;
	find(merchantId: string, orderId: string): Promise<Charge | null>;
	update(payment: Charge): Promise<void>;
}
