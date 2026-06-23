import type { PromotionStatus } from "@/components/promotion/types";

export function getPromotionStatusColor(status: PromotionStatus | string): string {
    return status === "active"
        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
        : "bg-rose-50 text-rose-600 border-rose-200";
}
