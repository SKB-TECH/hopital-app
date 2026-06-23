import type { Promotion, PromotionStatus, PromotionType } from "@/components/promotion/types";
import type { DashboardPromotion } from "@/shared/types/dashboard.types";

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
    });
}

function formatUsageLimit(limit: DashboardPromotion["usageLimit"]): string {
    if (limit == null) return "Unlimited";
    if (typeof limit === "number") return limit <= 0 ? "Unlimited" : String(limit);
    if (limit.toLowerCase() === "unlimited") return "Unlimited";
    return limit;
}

function normalizeType(type: string): PromotionType {
    return type?.toLowerCase() === "fixed" ? "fixed" : "percentage";
}

function normalizeStatus(status: string): PromotionStatus {
    return status?.toLowerCase() === "expired" ? "expired" : "active";
}

export function mapPromotion(item: DashboardPromotion, locale: string): Promotion {
    return {
        id: String(item.id),
        code: item.code,
        discount: item.discount,
        type: normalizeType(item.type),
        usageLimit: formatUsageLimit(item.usageLimit),
        used: item.used ?? 0,
        expiryDate: formatDate(item.expiryDate, locale),
        status: normalizeStatus(item.status),
        createdAt: item.createdAt ? formatDate(item.createdAt, locale) : "—",
    };
}

export function mapPromotions(
    promotions: DashboardPromotion[] | undefined,
    locale: string
): Promotion[] {
    return (promotions ?? []).map((item) => mapPromotion(item, locale));
}
