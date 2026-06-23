import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentService } from "@/shared/services/payment.service";
import type {
    CreatePaymentPayload,
    UpdatePaymentPayload,
} from "@/shared/types/payment.types";

const PAYMENTS_QUERY_KEY = ["payments"] as const;

export type PaymentsListParams = {
    page?: number;
    limit?: number;
};

export function usePayments(params?: PaymentsListParams) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;

    return useQuery({
        queryKey: [...PAYMENTS_QUERY_KEY, page, limit],
        queryFn: () => paymentService.listPayments({ page, limit }),
    });
}

export function usePayment(id?: string) {
    return useQuery({
        queryKey: [...PAYMENTS_QUERY_KEY, id],
        queryFn: () => paymentService.getPaymentById(id as string),
        enabled: Boolean(id),
    });
}

export function useCreatePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreatePaymentPayload) => paymentService.createPayment(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY });
        },
    });
}

export function useUpdatePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdatePaymentPayload }) =>
            paymentService.updatePayment(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY });
        },
    });
}

export function useDeletePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => paymentService.deletePayment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY });
        },
    });
}
