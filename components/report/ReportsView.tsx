"use client";

import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import type { SalesReportsPeriod } from "@/shared/services/dashboard.service";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { RecentTransactions } from "@/components/report/RecentTransactions";
import { mapRecentTransactions } from "@/components/report/utils/map-recent-transactions";
import { ReportsHeader } from "@/components/report/ReportsHeader";
import { ReportsMetricsGrid } from "@/components/report/ReportsMetricsGrid";
import { RevenueAnalytics } from "@/components/report/RevenueAnalytics";
import type { SalesMetrics } from "@/components/report/types";
import { useSidebar } from "@/contexts/SidebarContext";
import { useSalesReports } from "@/shared/hooks/dashboard.hooks";

const EMPTY_METRICS: SalesMetrics = {
    totalRevenue: 0,
    ticketsSold: 0,
    refundedAmount: 0,
    payoutsIssued: 0,
};

export function ReportsView() {
    const locale = useLocale();
    const { isCollapsed } = useSidebar();
    const [period, setPeriod] = useState<SalesReportsPeriod>("month");
    const {
        data: salesReports,
        isLoading: isSalesLoading,
        isFetching,
        refetch,
    } = useSalesReports(period);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const metrics: SalesMetrics = salesReports?.summary ?? EMPTY_METRICS;
    const isReportsLoading = isSalesLoading || isFetching;

    const allTransactions = useMemo(
        () => mapRecentTransactions(salesReports?.recentTransactions, locale),
        [salesReports?.recentTransactions, locale]
    );

    const filteredTransactions = useMemo(() => {
        return allTransactions.filter((transaction) => {
            const matchesSearch =
                transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                filterStatus === "all" ||
                transaction.status.toLowerCase() === filterStatus.toLowerCase();
            return matchesSearch && matchesStatus;
        });
    }, [allTransactions, searchTerm, filterStatus]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <DashboardSidebar />

            <div
                className={`transition-all duration-300 ${
                    isCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"
                }`}
            >
                <DashboardNavbar />

                <main className="p-4 sm:p-6 lg:p-8">
                    <ReportsHeader />
                    <ReportsMetricsGrid metrics={metrics} isLoading={isReportsLoading} />
                    <RevenueAnalytics
                        analytics={salesReports?.revenueAnalytics}
                        isLoading={isReportsLoading}
                        period={period}
                        onPeriodChange={setPeriod}
                        onRefresh={() => refetch()}
                    />
                    <RecentTransactions
                        transactions={filteredTransactions}
                        totalCount={allTransactions.length}
                        isLoading={isReportsLoading}
                        searchTerm={searchTerm}
                        onSearchTermChange={setSearchTerm}
                        filterStatus={filterStatus}
                        onFilterStatusChange={setFilterStatus}
                    />
                </main>
            </div>
        </div>
    );
}
