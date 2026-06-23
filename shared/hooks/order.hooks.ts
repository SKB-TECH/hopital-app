import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/shared/services/order.service";

const ORDERS_QUERY_KEY = ["orders"] as const;

export function useOrders(params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 100;

    return useQuery({
        queryKey: [...ORDERS_QUERY_KEY, page, limit],
        queryFn: () => orderService.listOrders({ page, limit }),
    });
}
