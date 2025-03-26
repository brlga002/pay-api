import { Charge } from "../entities/charge.entity";

export type ListChargesProps = {
	page: number;
	limit: number;
	sort: "asc" | "desc";
	merchantId?: string;
	orderId?: string;
};

export type ListChargesResponse = {
	meta: {
		itemCount: number;
		totalItems: number;
		itemsPerPage: number;
		totalPages: number;
		currentPage: number;
	};
	items: Charge[];
};

export interface IChargeRepository {
	save(payment: Charge): Promise<void>;
	find(merchantId: string, orderId: string): Promise<Charge | null>;
	update(payment: Charge): Promise<void>;
	list(props: ListChargesProps): Promise<ListChargesResponse>;
}
