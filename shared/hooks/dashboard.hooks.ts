import { useQuery } from "@tanstack/react-query";
import {
    dashboardService,
    type SalesReportsPeriod,
} from "@/shared/services/dashboard.service";

export function useSalesReports(period: SalesReportsPeriod = "month") {
    return useQuery({
        queryKey: ["dashboard", "sales", period],
        queryFn: () => dashboardService.getSalesReports(period),
    });
}

export type PromotionsDashboardParams = {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
};

export function usePromotionsDashboard(params?: PromotionsDashboardParams) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const status = params?.status ?? "all";
    const search = params?.search ?? "";

    return useQuery({
        queryKey: ["dashboard", "promotions", page, limit, status, search],
        queryFn: () =>
            dashboardService.getPromotionsDashboard({
                page,
                limit,
                status,
                search,
            }),
    });
}
