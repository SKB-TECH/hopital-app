import type { ChartData, ChartOptions } from "chart.js";
import type { RevenueAnalyticsPoint } from "@/shared/types/dashboard.types";

type RevenueChartLabels = {
    thisPeriod: string;
    lastPeriod: string;
    tooltipTitle: string;
};

function getScaleBounds(points: RevenueAnalyticsPoint[]) {
    const values = points.flatMap((p) => [p.thisPeriod, p.lastPeriod]);
    const max = Math.max(...values, 0);

    if (max === 0) {
        return { min: 0, max: 100, stepSize: 25 };
    }

    const paddedMax = Math.ceil(max * 1.15);
    const magnitude = Math.pow(10, Math.floor(Math.log10(paddedMax)));
    const stepSize = Math.max(magnitude / 2, 1);
    const maxBound = Math.ceil(paddedMax / stepSize) * stepSize;

    return { min: 0, max: maxBound, stepSize };
}

export function buildRevenueChartData(
    points: RevenueAnalyticsPoint[],
    labels: RevenueChartLabels
): ChartData<"line"> {
    return {
        labels: points.map((p) => p.label),
        datasets: [
            {
                label: labels.thisPeriod,
                data: points.map((p) => p.thisPeriod),
                borderColor: "#2563eb",
                backgroundColor: "rgba(37, 99, 235, 0.08)",
                pointBackgroundColor: "#2563eb",
                pointBorderColor: "#2563eb",
                pointRadius: 0,
                pointHoverRadius: 5,
                tension: 0.35,
                fill: true,
            },
            {
                label: labels.lastPeriod,
                data: points.map((p) => p.lastPeriod),
                borderColor: "#bfdbfe",
                backgroundColor: "rgba(191, 219, 254, 0.08)",
                pointRadius: 0,
                pointHoverRadius: 5,
                tension: 0.35,
                fill: true,
            },
        ],
    };
}

function formatAxisValue(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
}

function formatTooltipValue(value: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);
}

export function buildRevenueChartOptions(
    points: RevenueAnalyticsPoint[],
    labels: RevenueChartLabels
): ChartOptions<"line"> {
    const { min, max, stepSize } = getScaleBounds(points);

    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
                align: "end",
                labels: {
                    boxWidth: 8,
                    boxHeight: 8,
                    usePointStyle: true,
                    pointStyle: "circle",
                    color: "#64748b",
                    font: { size: 12 },
                },
            },
            tooltip: {
                backgroundColor: "#ffffff",
                titleColor: "#0f172a",
                bodyColor: "#64748b",
                borderColor: "#e2e8f0",
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                callbacks: {
                    title: () => labels.tooltipTitle,
                    label: (context) =>
                        `${context.dataset.label}: ${formatTooltipValue(Number(context.raw))}`,
                },
            },
        },
        scales: {
            x: {
                grid: { color: "#eef2f7" },
                border: { display: false },
                ticks: {
                    color: "#94a3b8",
                    maxTicksLimit: 8,
                    font: { size: 11 },
                },
            },
            y: {
                min,
                max,
                grid: { color: "#eef2f7" },
                border: { display: false },
                ticks: {
                    stepSize,
                    color: "#94a3b8",
                    callback: (value) => formatAxisValue(Number(value)),
                    font: { size: 11 },
                },
            },
        },
    };
}

export function computePeriodChangePercent(points: RevenueAnalyticsPoint[]): number | null {
    const thisSum = points.reduce((sum, p) => sum + p.thisPeriod, 0);
    const lastSum = points.reduce((sum, p) => sum + p.lastPeriod, 0);

    if (lastSum === 0) {
        return thisSum > 0 ? 100 : null;
    }

    return ((thisSum - lastSum) / lastSum) * 100;
}
