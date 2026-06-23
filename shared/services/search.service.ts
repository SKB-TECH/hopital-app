import { api } from "@/shared/lib/http/api";
import type { SearchParams, SearchResponse } from "@/shared/types/search.types";

function buildQuery(params: SearchParams) {
    const searchParams = new URLSearchParams();

    searchParams.set("q", params.q);
    searchParams.set("type", params.type || "all");
    searchParams.set("page", String(params.page || 1));
    searchParams.set("limit", String(params.limit || 10));

    return `?${searchParams.toString()}`;
}

export const searchService = {
    async search(params: SearchParams): Promise<SearchResponse> {
        const res = await api.get(`/search${buildQuery(params)}`, {
            skipAuth: true,
        } as any);

        return res.data;
    },
};
