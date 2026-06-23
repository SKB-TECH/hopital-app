import type { PaginatedResponse } from "@/shared/types/paginated.types";

export const TRANSACTION_STATUSES = ["PENDING", "SUCCESS", "FAILED", "CANCELLED"] as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export type TransactionRecord = {
    id: string;
    createdAt: string;
    updatedAt: string;
};

export type Transaction = TransactionRecord & {
    paymentId: string;
    status: TransactionStatus | string;
    amount: number;
    providerRef: string;
    rawResponse?: Record<string, unknown>;
};

export type CreateTransactionPayload = {
    paymentId: string;
    status: string;
    amount: number;
    providerRef: string;
    rawResponse?: Record<string, unknown>;
};

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;

export type TransactionsListResponse = PaginatedResponse<Transaction>;

export type TransactionMutationResponse = TransactionRecord;

export type DeleteTransactionResponse = {
    message?: string;
};
