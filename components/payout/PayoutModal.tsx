"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Payout } from "@/components/payout/types";
import { formatOrderSelectLabel } from "@/components/payout/utils/format-order-label";
import { useCreatePayment, useUpdatePayment } from "@/shared/hooks/payment.hooks";
import { useOrders } from "@/shared/hooks/order.hooks";
import type { Order } from "@/shared/types/order.types";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/shared/types/payment.types";

type PayoutModalProps = {
    payout?: Payout | null;
    onClose: () => void;
    onSaved?: () => void;
};

function toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function PayoutModal({ payout, onClose, onSaved }: PayoutModalProps) {
    const t = useTranslations("payoutsAdmin");
    const isEdit = Boolean(payout);
    const { data: ordersResponse, isLoading: isOrdersLoading } = useOrders();
    const createPayment = useCreatePayment();
    const updatePayment = useUpdatePayment();

    const [formData, setFormData] = useState({
        orderId: payout?.orderId ?? "",
        method: payout?.method ?? PAYMENT_METHODS[0],
        status: payout?.status.toUpperCase() ?? PAYMENT_STATUSES[0],
        amount: payout ? String(payout.amount) : "",
        currency: payout?.currency ?? "USD",
        providerRef: payout?.providerRef ?? "",
    });

    const orders: Order[] = ordersResponse?.data ?? [];

    const orderOptions = useMemo(() => {
        const options = orders.map((order) => ({
            id: order.id,
            label: formatOrderSelectLabel(order),
        }));

        if (
            isEdit &&
            payout?.orderId &&
            !options.some((option) => option.id === payout.orderId)
        ) {
            options.unshift({
                id: payout.orderId,
                label: `${payout.orderId} (${t("modal.currentOrder")})`,
            });
        }

        return options;
    }, [orders, isEdit, payout?.orderId, t]);

    const handleOrderChange = (orderId: string) => {
        const selected = orders.find((order) => order.id === orderId);

        setFormData((current) => ({
            ...current,
            orderId,
            amount: selected ? String(toNumber(selected.total)) : current.amount,
            currency: selected?.currency ?? current.currency,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const amount = parseFloat(formData.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            toast.warning(t("modal.amountRequired"));
            return;
        }

        if (!formData.orderId.trim()) {
            toast.warning(t("modal.orderIdRequired"));
            return;
        }

        const payload = {
            orderId: formData.orderId.trim(),
            method: formData.method,
            status: formData.status,
            amount,
            currency: formData.currency.trim(),
            providerRef: formData.providerRef.trim(),
        };

        try {
            if (isEdit && payout) {
                await updatePayment.mutateAsync({ id: payout.id, payload });
                toast.success(t("modal.updateSuccess"));
            } else {
                await createPayment.mutateAsync(payload);
                toast.success(t("modal.createSuccess"));
            }
            onSaved?.();
            onClose();
        } catch {
            toast.error(isEdit ? t("modal.updateError") : t("modal.createError"));
        }
    };

    const isSubmitting = createPayment.isPending || updatePayment.isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="animate-in zoom-in-95 w-full max-w-lg rounded bg-white shadow-2xl duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-xl font-extrabold text-slate-950">
                        {isEdit ? t("modal.editTitle") : t("addPayment")}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        title={t("modal.cancel")}
                        className="flex size-9 items-center justify-center rounded border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                    <div>
                        <label
                            htmlFor="payout-order-id"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            {t("modal.order")} <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="payout-order-id"
                            value={formData.orderId}
                            onChange={(e) => handleOrderChange(e.target.value)}
                            disabled={isSubmitting || isOrdersLoading || isEdit}
                            className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                            required
                        >
                            <option value="">
                                {isOrdersLoading
                                    ? t("modal.loadingOrders")
                                    : t("modal.orderPlaceholder")}
                            </option>
                            {orderOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {!isOrdersLoading && orders.length === 0 && !isEdit && (
                            <p className="mt-1.5 text-xs text-amber-600">{t("modal.noOrders")}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="payout-method"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                {t("modal.method")}
                            </label>
                            <select
                                id="payout-method"
                                value={formData.method}
                                onChange={(e) =>
                                    setFormData({ ...formData, method: e.target.value })
                                }
                                disabled={isSubmitting}
                                className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                            >
                                {PAYMENT_METHODS.map((method) => (
                                    <option key={method} value={method}>
                                        {method}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="payout-status"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                {t("table.status")}
                            </label>
                            <select
                                id="payout-status"
                                value={formData.status}
                                onChange={(e) =>
                                    setFormData({ ...formData, status: e.target.value })
                                }
                                disabled={isSubmitting}
                                className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                            >
                                {PAYMENT_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="payout-amount"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                {t("modal.amount")} <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="payout-amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) =>
                                    setFormData({ ...formData, amount: e.target.value })
                                }
                                disabled={isSubmitting}
                                className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                placeholder={t("modal.amountPlaceholder")}
                                required
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="payout-currency"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                {t("modal.currency")}
                            </label>
                            <input
                                id="payout-currency"
                                type="text"
                                value={formData.currency}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        currency: e.target.value.toUpperCase(),
                                    })
                                }
                                disabled={isSubmitting}
                                className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                placeholder={t("modal.currencyPlaceholder")}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="payout-provider-ref"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            {t("modal.providerRef")}
                        </label>
                        <input
                            id="payout-provider-ref"
                            type="text"
                            value={formData.providerRef}
                            onChange={(e) =>
                                setFormData({ ...formData, providerRef: e.target.value })
                            }
                            disabled={isSubmitting}
                            className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                            placeholder={t("modal.providerRefPlaceholder")}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                        >
                            {t("modal.cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (!isEdit && orders.length === 0)}
                            className="rounded bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting
                                ? t("modal.saving")
                                : isEdit
                                  ? t("modal.update")
                                  : t("modal.create")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
