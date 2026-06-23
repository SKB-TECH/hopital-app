import { api } from "@/shared/lib/http/api";
import type {
    CreateTransactionPayload,
    DeleteTransactionResponse,
    Transaction,
    TransactionMutationResponse,
    TransactionsListResponse,
    UpdateTransactionPayload,
} from "@/shared/types/transaction.types";

const BASE_PATH = "/transactions";

export const transactionService = {
    async listTransactions(params?: {
        page?: number;
        limit?: number;
    }): Promise<TransactionsListResponse> {
        const res = await api.get<TransactionsListResponse>(BASE_PATH, {
            params: {
                page: params?.page ?? 1,
                limit: params?.limit ?? 20,
            },
        });
        return res.data;
    },

    async getTransactionById(id: string): Promise<Transaction> {
        const res = await api.get<Transaction>(`${BASE_PATH}/${id}`);
        return res.data;
    },

    async createTransaction(
        payload: CreateTransactionPayload
    ): Promise<TransactionMutationResponse> {
        const res = await api.post<TransactionMutationResponse>(BASE_PATH, payload);
        return res.data;
    },

    async updateTransaction(
        id: string,
        payload: UpdateTransactionPayload
    ): Promise<TransactionMutationResponse> {
        const res = await api.patch<TransactionMutationResponse>(`${BASE_PATH}/${id}`, payload);
        return res.data;
    },

    async deleteTransaction(id: string): Promise<DeleteTransactionResponse> {
        const res = await api.delete<DeleteTransactionResponse>(`${BASE_PATH}/${id}`);
        return res.data ?? { message: "Transaction deleted" };
    },
};
