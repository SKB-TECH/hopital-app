import { CircleDollarSign, Link2, Tag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { MetricCard } from "@/components/promotion/MetricCard";
import type { PromotionsMetrics } from "@/components/promotion/types";
import { formatCurrency, formatNumber } from "@/shared/lib/formatNumber";

type PromotionsMetricsGridProps = {
    metrics: PromotionsMetrics;
    isLoading?: boolean;
};

export function PromotionsMetricsGrid({ metrics, isLoading = false }: PromotionsMetricsGridProps) {
    const t = useTranslations("promotionsAdmin");
    const locale = useLocale();

    const cards = [
        {
            icon: <Tag className="size-5" />,
            title: t("metrics.discountCodes"),
            value: formatNumber(metrics.discountCodesActive, locale),
        },
        {
            icon: <Link2 className="size-5" />,
            title: t("metrics.referralLinks"),
            value: formatNumber(metrics.referralLinksCreated, locale),
        },
        {
            icon: <CircleDollarSign className="size-5" />,
            title: t("metrics.salesFromPromotions"),
            value: formatCurrency(metrics.salesFromPromotions, locale),
        },
    ] as const;

    return (
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
                <MetricCard
                    key={card.title}
                    icon={card.icon}
                    title={card.title}
                    value={card.value}
                    isLoading={isLoading}
                />
            ))}
        </div>
    );
}
