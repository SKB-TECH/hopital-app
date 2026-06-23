import { api } from "@/shared/lib/http/api";
import type {
    GetPublicMarketplaceParams,
    PublicMarketplaceItem,
    PublicMarketplaceResponse,
} from "@/shared/types/marketplace.types";

function buildQuery(params?: GetPublicMarketplaceParams) {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.q) searchParams.set("q", params.q);
    if (params?.eventId) searchParams.set("eventId", params.eventId);
    if (params?.eventSlug) searchParams.set("eventSlug", params.eventSlug);

    const query = searchParams.toString();
    return query ? `?${query}` : "";
}

export const publicMarketplaceService = {
    async getItems(params?: GetPublicMarketplaceParams): Promise<PublicMarketplaceResponse> {
        const res = await api.get(`/public/marketplace${buildQuery(params)}`, {
            skipAuth: true,
        } as any);

        return res.data;
    },

    async getItem(id: string): Promise<PublicMarketplaceItem> {
        const res = await api.get(`/public/marketplace/${id}`, {
            skipAuth: true,
        } as any);

        return res.data;
    },
};
