import { api } from "@/shared/lib/http/api";
import type {
    PromotionsDashboardResponse,
    SalesReportsResponse,
} from "@/shared/types/dashboard.types";

export type SalesReportsPeriod = "day" | "week" | "month" | "year";

export const dashboardService = {
    async getSalesReports(period: SalesReportsPeriod = "month"): Promise<SalesReportsResponse> {
        const res = await api.get<SalesReportsResponse>("/dashboard/sales", {
            params: { period },
        });
        return res.data;
    },

    async getPromotionsDashboard(params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }): Promise<PromotionsDashboardResponse> {
        const res = await api.get<PromotionsDashboardResponse>("/dashboard/promotions", {
            params: {
                page: params?.page,
                limit: params?.limit,
                status: params?.status && params.status !== "all" ? params.status : undefined,
                search: params?.search?.trim() || undefined,
            },
        });
        return res.data;
    },
};
