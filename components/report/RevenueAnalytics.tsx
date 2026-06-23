"use client";

import { RefreshCcw, TrendingDown, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
    buildRevenueChartData,
    buildRevenueChartOptions,
    computePeriodChangePercent,
} from "@/components/report/chart/revenue-chart.config";
import { registerReportCharts } from "@/components/report/chart/register-chart";
import type { SalesReportsResponse } from "@/shared/types/dashboard.types";
import type { SalesReportsPeriod } from "@/shared/services/dashboard.service";
import { formatCurrency } from "@/shared/lib/formatNumber";

const PERIODS: SalesReportsPeriod[] = ["day", "week", "month", "year"];

registerReportCharts();

type RevenueAnalyticsProps = {
    analytics?: SalesReportsResponse["revenueAnalytics"];
    isLoading?: boolean;
    period: SalesReportsPeriod;
    onPeriodChange: (period: SalesReportsPeriod) => void;
    onRefresh?: () => void;
};

export function RevenueAnalytics({
    analytics,
    isLoading = false,
    period,
    onPeriodChange,
    onRefresh,
}: RevenueAnalyticsProps) {
    const t = useTranslations("reports");
    const locale = useLocale();

    const points = analytics?.points ?? [];
    const total = analytics?.total ?? 0;

    const chartLabels = useMemo(
        () => ({
            thisPeriod: t("chart.thisPeriod"),
            lastPeriod: t("chart.lastPeriod"),
            tooltipTitle: t("revenueAnalytics"),
        }),
        [t]
    );

    const chartData = useMemo(
        () => buildRevenueChartData(points, chartLabels),
        [points, chartLabels]
    );

    const chartOptions = useMemo(
        () => buildRevenueChartOptions(points, chartLabels),
        [points, chartLabels]
    );

    const changePercent = useMemo(() => computePeriodChangePercent(points), [points]);
    const isPositiveTrend = changePercent !== null && changePercent >= 0;

    return (
        <div className="mb-6 rounded border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-slate-900">{t("revenueAnalytics")}</h2>

                <div className="flex items-center gap-3">
                    <div className="flex gap-1 rounded bg-slate-100 p-1">
                        {PERIODS.map((p) => (
                            <button
                                key={p}
                                type="button"
                                disabled={isLoading}
                                onClick={() => onPeriodChange(p)}
                                className={`rounded px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
                                    period === p
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {t(p)}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        title={t("revenueAnalytics")}
                        disabled={isLoading}
                        onClick={onRefresh}
                        className="flex size-9 items-center justify-center rounded border border-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCcw
                            className={`size-4 text-slate-400 ${isLoading ? "animate-spin" : ""}`}
                        />
                    </button>
                </div>
            </div>

            <div className="px-5 pt-5">
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        {isLoading ? (
                            <div className="h-9 w-40 animate-pulse rounded bg-slate-100" />
                        ) : (
                            <p className="text-3xl font-bold text-slate-900">
                                {formatCurrency(total, locale)}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">{t("chart.totalThisPeriod")}</p>
                    </div>
                    {!isLoading && changePercent !== null && (
                        <div className="flex items-center gap-2 pb-1">
                            <span
                                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${
                                    isPositiveTrend
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-rose-50 text-rose-600"
                                }`}
                            >
                                {isPositiveTrend ? (
                                    <TrendingUp className="size-3" />
                                ) : (
                                    <TrendingDown className="size-3" />
                                )}
                                {Math.abs(changePercent).toFixed(1)}%
                            </span>
                            <span className="text-xs text-slate-400">{t("fromLastPeriod")}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-[300px] px-4 pb-5 pt-5 sm:px-5">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="h-full w-full animate-pulse rounded bg-slate-100" />
                    </div>
                ) : points.length > 0 ? (
                    <Line data={chartData} options={chartOptions} />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        {t("chart.noData")}
                    </div>
                )}
            </div>
        </div>
    );
}
