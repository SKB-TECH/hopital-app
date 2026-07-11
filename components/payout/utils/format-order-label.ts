import type { Order } from "@/shared/types/order.types";

function formatAmount(total: number, currency: string): string {
    const value = Number(total);
    if (!Number.isFinite(value)) return `0 ${currency}`;
    return `${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function getOrderCustomerLabel(order: Order): string {
    return order.user?.fullName ?? order.user?.email ?? "Client";
}

export function formatOrderSelectLabel(order: Order): string {
    const customer = getOrderCustomerLabel(order);
    const amount = formatAmount(order.total, order.currency);
    const status = String(order.status).toUpperCase();

    return `${customer} — ${amount} — ${status}`;
}
