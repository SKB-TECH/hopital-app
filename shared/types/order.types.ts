import type { PaginatedResponse } from "@/shared/types/paginated.types";

export const ORDER_STATUSES = ["PENDING", "PAID", "CANCELLED", "REFUNDED", "EXPIRED"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderUser = {
    id: string;
    fullName?: string;
    email?: string;
};

export type Order = {
    id: string;
    userId: string;
    status: OrderStatus | string;
    total: number;
    currency: string;
    user?: OrderUser;
    createdAt?: string;
    updatedAt?: string;
};

export type OrdersListResponse = PaginatedResponse<Order>;
