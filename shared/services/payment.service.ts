import { api } from "@/shared/lib/http/api";
import type {
    CreatePaymentPayload,
    DeletePaymentResponse,
    Payment,
    PaymentMutationResponse,
    PaymentsListResponse,
    UpdatePaymentPayload,
} from "@/shared/types/payment.types";

const BASE_PATH = "/payments";

export const paymentService = {
    async listPayments(params?: { page?: number; limit?: number }): Promise<PaymentsListResponse> {
        const res = await api.get<PaymentsListResponse>(BASE_PATH, {
            params: {
                page: params?.page ?? 1,
                limit: params?.limit ?? 20,
            },
        });
        return res.data;
    },

    async getPaymentById(id: string): Promise<Payment> {
        const res = await api.get<Payment>(`${BASE_PATH}/${id}`);
        return res.data;
    },

    async createPayment(payload: CreatePaymentPayload): Promise<PaymentMutationResponse> {
        const res = await api.post<PaymentMutationResponse>(BASE_PATH, payload);
        return res.data;
    },

    async updatePayment(
        id: string,
        payload: UpdatePaymentPayload
    ): Promise<PaymentMutationResponse> {
        const res = await api.patch<PaymentMutationResponse>(`${BASE_PATH}/${id}`, payload);
        return res.data;
    },

    async deletePayment(id: string): Promise<DeletePaymentResponse> {
        const res = await api.delete<DeletePaymentResponse>(`${BASE_PATH}/${id}`);
        return res.data ?? { message: "Payment deleted" };
    },
};
