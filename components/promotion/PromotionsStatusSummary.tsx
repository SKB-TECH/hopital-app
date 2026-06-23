import { CheckCircle, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { PromotionsStatusCounts } from "@/components/promotion/types";
import { formatNumber } from "@/shared/lib/formatNumber";

type PromotionsStatusSummaryProps = {
    counts: PromotionsStatusCounts;
    isLoading?: boolean;
};

export function PromotionsStatusSummary({ counts, isLoading = false }: PromotionsStatusSummaryProps) {
    const t = useTranslations("promotionsAdmin");
    const locale = useLocale();

    const items = [
        {
            label: t("statusSummary.active"),
            value: counts.active,
            icon: CheckCircle,
            cardClass: "border-emerald-100 bg-emerald-50",
            labelClass: "text-emerald-600",
            valueClass: "text-emerald-700",
            iconClass: "text-emerald-500",
        },
        {
            label: t("statusSummary.expired"),
            value: counts.expired,
            icon: Clock,
            cardClass: "border-rose-100 bg-rose-50",
            labelClass: "text-rose-600",
            valueClass: "text-rose-700",
            iconClass: "text-rose-500",
        },
    ] as const;

    return (
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {items.map((item) => (
                <div key={item.label} className={`rounded border p-4 ${item.cardClass}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`mb-1 text-sm font-medium ${item.labelClass}`}>{item.label}</p>
                            {isLoading ? (
                                <div className="h-8 w-16 animate-pulse rounded bg-white/60" />
                            ) : (
                                <p className={`text-2xl font-bold ${item.valueClass}`}>
                                    {formatNumber(item.value, locale)}
                                </p>
                            )}
                        </div>
                        <item.icon className={`size-8 ${item.iconClass}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}
