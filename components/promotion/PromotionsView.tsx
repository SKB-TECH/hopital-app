"use client";

import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { PromotionModal } from "@/components/promotion/PromotionModal";
import { PromotionsHeader } from "@/components/promotion/PromotionsHeader";
import { PromotionsMetricsGrid } from "@/components/promotion/PromotionsMetricsGrid";
import { PromotionsStatusSummary } from "@/components/promotion/PromotionsStatusSummary";
import { PromotionsTable, type PromotionSortField } from "@/components/promotion/PromotionsTable";
import type { Promotion, PromotionsMetrics, PromotionsStatusCounts } from "@/components/promotion/types";
import { mapPromotions } from "@/components/promotion/utils/map-promotions";
import { useSidebar } from "@/contexts/SidebarContext";
import { usePromotionsDashboard } from "@/shared/hooks/dashboard.hooks";

const PAGE_LIMIT = 10;

const EMPTY_METRICS: PromotionsMetrics = {
    discountCodesActive: 0,
    referralLinksCreated: 0,
    salesFromPromotions: 0,
};

const EMPTY_STATUS: PromotionsStatusCounts = {
    active: 0,
    expired: 0,
};

export function PromotionsView() {
    const locale = useLocale();
    const { isCollapsed } = useSidebar();

    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortBy, setSortBy] = useState<PromotionSortField>("code");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    useEffect(() => {
        setPage(1);
    }, [searchTerm, filterStatus]);

    const {
        data: promotionsDashboard,
        isLoading: isPromotionsLoading,
        isFetching,
    } = usePromotionsDashboard({
        page,
        limit: PAGE_LIMIT,
        status: filterStatus,
        search: searchTerm,
    });

    const isTableLoading = isPromotionsLoading || isFetching;
    const isMetricsLoading = isTableLoading && !promotionsDashboard;
    const summary = promotionsDashboard?.summary;

    const metrics: PromotionsMetrics = summary
        ? {
              discountCodesActive: summary.discountCodesActive,
              referralLinksCreated: summary.referralLinksCreated,
              salesFromPromotions: summary.salesFromPromotions,
          }
        : EMPTY_METRICS;

    const statusCounts: PromotionsStatusCounts = summary
        ? {
              active: summary.activePromotions,
              expired: summary.expiredPromotions,
          }
        : EMPTY_STATUS;

    const apiPromotions = useMemo(
        () => mapPromotions(promotionsDashboard?.promotions, locale),
        [promotionsDashboard?.promotions, locale]
    );

    const sortedPromotions = useMemo(() => {
        return [...apiPromotions].sort((a, b) => {
            if (sortBy === "code") {
                return sortOrder === "asc"
                    ? a.code.localeCompare(b.code)
                    : b.code.localeCompare(a.code);
            }
            if (sortBy === "used") {
                return sortOrder === "asc" ? a.used - b.used : b.used - a.used;
            }
            return sortOrder === "asc"
                ? new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
                : new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime();
        });
    }, [apiPromotions, sortBy, sortOrder]);

    const totalCount = promotionsDashboard?.total ?? 0;
    const totalPages = promotionsDashboard?.pages ?? 0;
    const currentPage = promotionsDashboard?.page ?? page;

    const openCreateModal = () => {
        setSelectedPromotion(null);
        setModalOpen(true);
    };

    const openEditModal = (promotion: Promotion) => {
        setSelectedPromotion(promotion);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedPromotion(null);
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
                    <PromotionsHeader onAddPromotion={openCreateModal} />
                    <PromotionsMetricsGrid metrics={metrics} isLoading={isMetricsLoading} />
                    <PromotionsStatusSummary counts={statusCounts} isLoading={isMetricsLoading} />
                    <PromotionsTable
                        promotions={sortedPromotions}
                        totalCount={totalCount}
                        page={currentPage}
                        pages={totalPages}
                        limit={promotionsDashboard?.limit ?? PAGE_LIMIT}
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
                <PromotionModal promotion={selectedPromotion} onClose={closeModal} />
            )}
        </div>
    );
}
