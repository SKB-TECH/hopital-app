
export type PayoutStatus = "pending" | "completed" | "failed" | "cancelled" | "refunded";

export type PayoutTransactionStatus = "pending" | "success" | "failed" | "cancelled";

export type Payout = {
    id: string;
    orderId: string;
    method: string;
    amount: number;
    currency: string;
    status: PayoutStatus;
    providerRef: string;
    createdAt: string;
    updatedAt: string;
};

export type PayoutTransaction = {
    id: string;
    paymentId: string;
    status: PayoutTransactionStatus;
    amount: number;
    providerRef: string;
    createdAt: string;
    updatedAt: string;
};

export type PayoutsMetrics = {
    totalPayments: number;
    totalAmount: number;
    pendingPayments: number;
    completedPayments: number;
};

export type PayoutsStatusCounts = {
    pending: number;
    completed: number;
    failed: number;
};

export type PayoutSortField = "orderId" | "amount" | "createdAt" | "status";

export type PayoutTransactionSortField = "paymentId" | "amount" | "createdAt" | "status";
