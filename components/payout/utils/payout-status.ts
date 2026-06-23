import type { PayoutStatus } from "@/components/payout/types";

export function normalizePayoutStatus(status: string): PayoutStatus {
    const value = status.toLowerCase();

    if (value === "completed" || value === "success") return "completed";
    if (value === "processing") return "pending";
    if (value === "failed") return "failed";
    if (value === "cancelled" || value === "canceled") return "cancelled";
    if (value === "refunded") return "refunded";

    return "pending";
}

export function getPayoutStatusColor(status: PayoutStatus): string {
    switch (status) {
        case "completed":
            return "bg-emerald-50 text-emerald-600 border-emerald-200";
        case "failed":
            return "bg-rose-50 text-rose-600 border-rose-200";
        case "cancelled":
            return "bg-slate-50 text-slate-600 border-slate-200";
        case "refunded":
            return "bg-amber-50 text-amber-600 border-amber-200";
        default:
            return "bg-blue-50 text-blue-600 border-blue-200";
    }
}
