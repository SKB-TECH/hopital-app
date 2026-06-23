import type { Payout } from "@/components/payout/types";
import { normalizePayoutStatus } from "@/components/payout/utils/payout-status";
import type { Payment } from "@/shared/types/payment.types";

const DATE_LOCALES: Record<string, string> = {
    fr: "fr-FR",
    en: "en-US",
};

function formatDate(value: string, locale: string): string {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleDateString(DATE_LOCALES[locale] ?? locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function mapPayment(item: Payment, locale: string): Payout {
    return {
        id: item.id,
        orderId: item.orderId,
        method: item.method,
        amount: item.amount,
        currency: item.currency,
        status: normalizePayoutStatus(item.status),
        providerRef: item.providerRef,
        createdAt: formatDate(item.createdAt, locale),
        updatedAt: formatDate(item.updatedAt, locale),
    };
}

export function mapPayments(payments: Payment[] | undefined, locale: string): Payout[] {
    return (payments ?? []).map((item) => mapPayment(item, locale));
}
