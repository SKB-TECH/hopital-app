import { CircleDollarSign, CreditCard, RefreshCcw, Ticket } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { MetricCard } from "@/components/report/MetricCard";
import type { SalesMetrics } from "@/components/report/types";
import { formatCurrency, formatNumber } from "@/shared/lib/formatNumber";

type ReportsMetricsGridProps = {
    metrics: SalesMetrics;
    isLoading?: boolean;
};

export function ReportsMetricsGrid({ metrics, isLoading = false }: ReportsMetricsGridProps) {
    const t = useTranslations("reports");
    const locale = useLocale();

    const cards = [
        {
            icon: <CircleDollarSign className="size-5" />,
            title: t("metrics.totalRevenue"),
            value: formatCurrency(metrics.totalRevenue, locale),
        },
        {
            icon: <Ticket className="size-5" />,
            title: t("metrics.ticketsSold"),
            value: formatNumber(metrics.ticketsSold, locale),
        },
        {
            icon: <RefreshCcw className="size-5" />,
            title: t("metrics.refundedAmount"),
            value: formatCurrency(metrics.refundedAmount, locale),
        },
        {
            icon: <CreditCard className="size-5" />,
            title: t("metrics.payoutsIssued"),
            value: formatCurrency(metrics.payoutsIssued, locale),
        },
    ] as const;

    return (
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
