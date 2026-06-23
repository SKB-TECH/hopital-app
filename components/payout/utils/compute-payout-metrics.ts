import type { Payout, PayoutsMetrics, PayoutsStatusCounts } from "@/components/payout/types";

export function computePayoutsMetrics(payouts: Payout[], totalCount: number): PayoutsMetrics {
    return {
        totalPayments: totalCount,
        totalAmount: payouts.reduce((sum, payout) => sum + payout.amount, 0),
        pendingPayments: payouts.filter((p) => p.status === "pending").length,
        completedPayments: payouts.filter((p) => p.status === "completed").length,
    };
}

export function computePayoutsStatusCounts(payouts: Payout[]): PayoutsStatusCounts {
    return {
        pending: payouts.filter((p) => p.status === "pending").length,
        completed: payouts.filter((p) => p.status === "completed").length,
        failed: payouts.filter((p) => p.status === "failed").length,
    };
}
