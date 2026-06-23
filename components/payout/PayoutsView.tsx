"use client";

import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { PayoutModal } from "@/components/payout/PayoutModal";
import { PayoutsHeader } from "@/components/payout/PayoutsHeader";
import { PayoutsMetricsGrid } from "@/components/payout/PayoutsMetricsGrid";
import { PayoutsStatusSummary } from "@/components/payout/PayoutsStatusSummary";
import { PayoutsTable, type PayoutSortField } from "@/components/payout/PayoutsTable";
import type { Payout, PayoutsMetrics, PayoutsStatusCounts } from "@/components/payout/types";
import {
    computePayoutsMetrics,
    computePayoutsStatusCounts,
} from "@/components/payout/utils/compute-payout-metrics";
import { mapPayments } from "@/components/payout/utils/map-payments";
import { useSidebar } from "@/contexts/SidebarContext";
import { usePayments } from "@/shared/hooks/payment.hooks";

const PAGE_LIMIT = 10;
const METRICS_LIMIT = 100;

const EMPTY_METRICS: PayoutsMetrics = {
    totalPayments: 0,
    totalAmount: 0,
    pendingPayments: 0,
    completedPayments: 0,
};

const EMPTY_STATUS: PayoutsStatusCounts = {
    pending: 0,
    completed: 0,
    failed: 0,
};

export function PayoutsView() {
    const locale = useLocale();
    const { isCollapsed } = useSidebar();

    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortBy, setSortBy] = useState<PayoutSortField>("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    useEffect(() => {
        setPage(1);
    }, [searchTerm, filterStatus]);

    const {
        data: paymentsResponse,
        isLoading: isPaymentsLoading,
        isFetching,
    } = usePayments({ page, limit: PAGE_LIMIT });

    const { data: metricsResponse, isLoading: isMetricsQueryLoading } = usePayments({
        page: 1,
        limit: METRICS_LIMIT,
    });

    const isTableLoading = isPaymentsLoading || isFetching;
    const isMetricsLoading = isMetricsQueryLoading && !metricsResponse;

    const apiPayouts = useMemo(
        () => mapPayments(paymentsResponse?.data, locale),
        [paymentsResponse?.data, locale]
    );

    const metricsPayouts = useMemo(
        () => mapPayments(metricsResponse?.data, locale),
        [metricsResponse?.data, locale]
    );

    const filteredPayouts = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return apiPayouts.filter((payout) => {
            const matchesSearch =
                !term ||
                payout.orderId.toLowerCase().includes(term) ||
                payout.method.toLowerCase().includes(term) ||
                payout.providerRef.toLowerCase().includes(term) ||
                payout.currency.toLowerCase().includes(term);

            const matchesStatus = filterStatus === "all" || payout.status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [apiPayouts, searchTerm, filterStatus]);

    const sortedPayouts = useMemo(() => {
        return [...filteredPayouts].sort((a, b) => {
            if (sortBy === "orderId") {
                return sortOrder === "asc"
                    ? a.orderId.localeCompare(b.orderId)
                    : b.orderId.localeCompare(a.orderId);
            }
            if (sortBy === "amount") {
                return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
            }
            if (sortBy === "status") {
                return sortOrder === "asc"
                    ? a.status.localeCompare(b.status)
                    : b.status.localeCompare(a.status);
            }
            return sortOrder === "asc"
                ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [filteredPayouts, sortBy, sortOrder]);

    const metrics: PayoutsMetrics = metricsResponse
        ? computePayoutsMetrics(metricsPayouts, metricsResponse.total)
        : EMPTY_METRICS;

    const statusCounts: PayoutsStatusCounts = metricsResponse
        ? computePayoutsStatusCounts(metricsPayouts)
        : EMPTY_STATUS;

    const totalCount = paymentsResponse?.total ?? 0;
    const totalPages = paymentsResponse?.pages ?? 0;
    const currentPage = paymentsResponse?.page ?? page;

    const openCreateModal = () => {
        setSelectedPayout(null);
        setModalOpen(true);
    };

    const openEditModal = (payout: Payout) => {
        setSelectedPayout(payout);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedPayout(null);
    };

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
                    <PayoutsHeader onAddPayment={openCreateModal} />
                    <PayoutsMetricsGrid metrics={metrics} isLoading={isMetricsLoading} />
                    <PayoutsStatusSummary counts={statusCounts} isLoading={isMetricsLoading} />
                    <PayoutsTable
                        payouts={sortedPayouts}
                        totalCount={totalCount}
                        page={currentPage}
                        pages={totalPages}
                        limit={paymentsResponse?.limit ?? PAGE_LIMIT}
                        isLoading={isTableLoading}
                        searchTerm={searchTerm}
                        onSearchTermChange={setSearchTerm}
                        filterStatus={filterStatus}
                        onFilterStatusChange={setFilterStatus}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSortChange={(field, order) => {
                            setSortBy(field);
                            setSortOrder(order);
                        }}
                        onPageChange={setPage}
                        onEdit={openEditModal}
                        onCreate={openCreateModal}
                    />
                </main>
            </div>

            {modalOpen && (
                <PayoutModal payout={selectedPayout} onClose={closeModal} />
            )}
        </div>
    );
}
