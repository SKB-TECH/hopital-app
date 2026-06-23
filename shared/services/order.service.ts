import { api } from "@/shared/lib/http/api";
import type { Order, OrdersListResponse } from "@/shared/types/order.types";

const BASE_PATH = "/orders";

export const orderService = {
    async listOrders(params?: { page?: number; limit?: number }): Promise<OrdersListResponse> {
        const res = await api.get<OrdersListResponse>(BASE_PATH, {
            params: {
                page: params?.page ?? 1,
                limit: params?.limit ?? 100,
            },
        });
        return res.data;
    },

    async getOrderById(id: string): Promise<Order> {
        const res = await api.get<Order>(`${BASE_PATH}/${id}`);
        return res.data;
    },
};
