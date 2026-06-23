"use client";

import { useQuery } from "@tanstack/react-query";
import { publicMarketplaceService } from "@/shared/services/public-marketplace.service";
import type { GetPublicMarketplaceParams } from "@/shared/types/marketplace.types";

export function useGetPublicMarketplaceItems(params?: GetPublicMarketplaceParams) {
    return useQuery({
        queryKey: ["public-marketplace", params],
        queryFn: () => publicMarketplaceService.getItems(params),
        staleTime: 60 * 1000,
        select: (response) => ({
            items: response.data,
            page: response.page,
            limit: response.limit,
            total: response.total,
            pages: response.pages,
        }),
    });
}

export function useGetPublicMarketplaceItem(id?: string) {
    return useQuery({
        queryKey: ["public-marketplace-item", id],
        queryFn: () => publicMarketplaceService.getItem(id as string),
        enabled: !!id,
        staleTime: 60 * 1000,
    });
}
