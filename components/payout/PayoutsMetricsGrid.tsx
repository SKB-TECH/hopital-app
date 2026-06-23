import { CircleDollarSign, CreditCard, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { MetricCard } from "@/components/promotion/MetricCard";
import type { PayoutsMetrics } from "@/components/payout/types";
import { formatCurrency, formatNumber } from "@/shared/lib/formatNumber";

type PayoutsMetricsGridProps = {
    metrics: PayoutsMetrics;
    isLoading?: boolean;
};

export function PayoutsMetricsGrid({ metrics, isLoading = false }: PayoutsMetricsGridProps) {
    const t = useTranslations("payoutsAdmin");
    const locale = useLocale();

    const cards = [
        {
            icon: <CreditCard className="size-5" />,
            title: t("metrics.totalPayments"),
            value: formatNumber(metrics.totalPayments, locale),
        },
        {
            icon: <CircleDollarSign className="size-5" />,
            title: t("metrics.totalAmount"),
            value: formatCurrency(metrics.totalAmount, locale),
        },
        {
            icon: <Wallet className="size-5" />,
            title: t("metrics.completedPayments"),
            value: formatNumber(metrics.completedPayments, locale),
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
