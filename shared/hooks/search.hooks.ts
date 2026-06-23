"use client";

import { useQuery } from "@tanstack/react-query";
import { searchService } from "@/shared/services/search.service";
import type { SearchParams } from "@/shared/types/search.types";

export function useSearch(params: SearchParams, enabled = true) {
    return useQuery({
        queryKey: ["search", params],
        queryFn: () => searchService.search(params),
        enabled: enabled && params.q.trim().length >= 2,
        staleTime: 30 * 1000,
    });
}
