import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionService } from "@/shared/services/transaction.service";
import type {
    CreateTransactionPayload,
    UpdateTransactionPayload,
} from "@/shared/types/transaction.types";

const TRANSACTIONS_QUERY_KEY = ["transactions"] as const;

export type TransactionsListParams = {
    page?: number;
    limit?: number;
};

export function useTransactions(params?: TransactionsListParams) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;

    return useQuery({
        queryKey: [...TRANSACTIONS_QUERY_KEY, page, limit],
        queryFn: () => transactionService.listTransactions({ page, limit }),
    });
}

export function useCreateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateTransactionPayload) =>
            transactionService.createTransaction(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
        },
    });
}

export function useUpdateTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateTransactionPayload }) =>
            transactionService.updateTransaction(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
        },
    });
}

export function useDeleteTransaction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => transactionService.deleteTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
        },
    });
}
