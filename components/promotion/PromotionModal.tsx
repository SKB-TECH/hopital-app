"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type { Promotion, PromotionType } from "@/components/promotion/types";
import {
    parseDiscountValue,
    parseMaxUses,
    toExpiresAtIso,
} from "@/components/promotion/utils/coupon-form";
import { useCreateCoupon } from "@/shared/hooks/coupon.hooks";
import { useEvents } from "@/shared/hooks/event.hooks";
import type { Event } from "@/shared/types/event.types";

type PromotionModalProps = {
    promotion?: Promotion | null;
    onClose: () => void;
    onCreated?: () => void;
};

function getEventLabel(event: Event): string {
    return event.title ?? event.name ?? event.id;
}

export function PromotionModal({ promotion, onClose, onCreated }: PromotionModalProps) {
    const t = useTranslations("promotionsAdmin");
    const isEdit = Boolean(promotion);
    const { data: eventsResponse, isLoading: isEventsLoading } = useEvents();
    const createCoupon = useCreateCoupon();

    const [formData, setFormData] = useState({
        eventId: "",
        code: promotion?.code ?? "",
        discount: promotion?.discount ?? "",
        type: promotion?.type ?? ("percentage" as PromotionType),
        usageLimit: promotion?.usageLimit ?? "",
        expiryDate: "",
    });

    const events: Event[] = eventsResponse?.data ?? [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit) {
            toast.info(t("modal.editNotAvailable"));
            return;
        }

        if (!formData.eventId) {
            toast.warning(t("modal.eventRequired"));
            return;
        }

        const discount = parseDiscountValue(formData.discount);
        if (discount <= 0) {
            toast.warning(t("modal.discountRequired"));
            return;
        }

        if (!formData.expiryDate) {
            toast.warning(t("modal.expiryRequired"));
            return;
        }

        try {
            await createCoupon.mutateAsync({
                eventId: formData.eventId,
                code: formData.code.trim(),
                discount,
                maxUses: parseMaxUses(formData.usageLimit),
                expiresAt: toExpiresAtIso(formData.expiryDate),
            });
            toast.success(t("modal.createSuccess"));
            onCreated?.();
            onClose();
        } catch {
            toast.error(t("modal.createError"));
        }
    };

    const isSubmitting = createCoupon.isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="animate-in zoom-in-95 w-full max-w-lg rounded bg-white shadow-2xl duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-xl font-extrabold text-slate-950">
                        {promotion ? t("modal.editTitle") : t("addPromotion")}
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
                            htmlFor="promotion-event"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            {t("modal.event")} <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="promotion-event"
                            value={formData.eventId}
                            onChange={(e) =>
                                setFormData({ ...formData, eventId: e.target.value })
                            }
                            disabled={isEdit || isEventsLoading || isSubmitting}
                            className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                            required
                        >
                            <option value="">
                                {isEventsLoading
                                    ? t("modal.loadingEvents")
                                    : t("modal.eventPlaceholder")}
                            </option>
                            {events.map((event) => (
                                <option key={event.id} value={event.id}>
                                    {getEventLabel(event)}
                                </option>
                            ))}
                        </select>
                        {!isEventsLoading && events.length === 0 && (
                            <p className="mt-1.5 text-xs text-amber-600">{t("modal.noEvents")}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            {t("modal.code")} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) =>
                                setFormData({ ...formData, code: e.target.value.toUpperCase() })
                            }
                            disabled={isEdit || isSubmitting}
                            className="h-11 w-full rounded border border-slate-200 bg-white px-4 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                            placeholder={t("modal.codePlaceholder")}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="promotion-discount-type"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                {t("modal.discountType")}
                            </label>
                            <select
                                id="promotion-discount-type"
                                value={formData.type}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        type: e.target.value as PromotionType,
                                    })
                                }
                                disabled={isEdit || isSubmitting}
                                className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                            >
                                <option value="percentage">{t("modal.typePercentage")}</option>
                                <option value="fixed">{t("modal.typeFixed")}</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                {t("modal.discountValue")} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={formData.discount}
                                onChange={(e) =>
                                    setFormData({ ...formData, discount: e.target.value })
                                }
                                disabled={isEdit || isSubmitting}
                                className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                placeholder={
                                    formData.type === "percentage"
                                        ? t("modal.discountPlaceholderPercent")
                                        : t("modal.discountPlaceholderFixed")
                                }
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                {t("modal.usageLimit")}
                            </label>
                            <input
                                type="text"
                                value={formData.usageLimit}
                                onChange={(e) =>
                                    setFormData({ ...formData, usageLimit: e.target.value })
                                }
                                disabled={isEdit || isSubmitting}
                                className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                placeholder={t("modal.usageLimitPlaceholder")}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="promotion-expiry"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                {t("table.expiryDate")} <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="promotion-expiry"
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, expiryDate: e.target.value })
                                }
                                disabled={isEdit || isSubmitting}
                                className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                required
                            />
                        </div>
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
                            disabled={isSubmitting || (!isEdit && events.length === 0)}
                            className="rounded bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting
                                ? t("modal.creating")
                                : promotion
                                  ? t("modal.update")
                                  : t("modal.create")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
