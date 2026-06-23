import { api } from "@/shared/lib/http/api";
import { tokenStore } from "@/shared/lib/tokenStore";
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from "@/shared/types/auth.types";

function saveAuthTokens(data: AuthResponse) {
    if (data.accessToken) {
        tokenStore.set(data.accessToken);
    }

    if (data.refreshToken) {
        tokenStore.setRefresh(data.refreshToken);
    }
}

export type PortalTicket = {
    id: string;
    code?: string;
    qrCodeUrl?: string | null;
    status?: string;
    createdAt?: string;
    event?: {
        id: string;
        title: string;
        slug?: string;
        bannerUrl?: string | null;
        startAt?: string;
        venue?: {
            name?: string | null;
            city?: string | null;
            country?: string | null;
        } | null;
        category?: {
            name?: string | null;
        } | null;
    } | null;
    ticketType?: {
        name?: string | null;
        price?: number | string | null;
        currency?: string | null;
    } | null;
};

export type PortalListResponse<T> = {
    data: T[];
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
};

export type PortalEventReaction = {
    eventId: string;
    liked: boolean;
    likeCount: number;
    reviewCount: number;
    myReview?: unknown;
};

export const portalService = {
    async register(payload: RegisterPayload): Promise<AuthResponse> {
        const res = await api.post<AuthResponse>("/portal/auth/register", payload, { skipAuth: true } as any);
        saveAuthTokens(res.data);
        return res.data;
    },

    async login(payload: LoginPayload): Promise<AuthResponse> {
        const res = await api.post<AuthResponse>("/portal/auth/login", payload, { skipAuth: true } as any);
        saveAuthTokens(res.data);
        return res.data;
    },

    async me(): Promise<AuthUser> {
        const res = await api.get<AuthUser>("/portal/auth/me");
        return res.data;
    },

    async tickets(params: Record<string, string | number> = {}): Promise<PortalListResponse<PortalTicket>> {
        const res = await api.get<PortalListResponse<PortalTicket>>("/portal/me/tickets", { params });
        return res.data;
    },

    async ticketQr(ticketId: string) {
        const res = await api.get(`/portal/me/tickets/${ticketId}/qr`);
        return res.data;
    },

    async orders(params: Record<string, string | number> = {}) {
        const res = await api.get("/portal/me/orders", { params });
        return res.data;
    },

    async events() {
        const res = await api.get("/portal/me/events");
        return res.data;
    },

    async bookings() {
        const res = await api.get("/portal/me/bookings");
        return res.data;
    },

    async overview() {
        const res = await api.get("/portal/me/overview");
        return res.data;
    },

    async eventReaction(slug: string): Promise<PortalEventReaction> {
        const res = await api.get<PortalEventReaction>(`/portal/events/${encodeURIComponent(slug)}/reaction`);
        return res.data;
    },

    async likeEvent(slug: string): Promise<PortalEventReaction> {
        const res = await api.post<PortalEventReaction>(`/portal/events/${encodeURIComponent(slug)}/like`);
        return res.data;
    },

    async unlikeEvent(slug: string): Promise<PortalEventReaction> {
        const res = await api.delete<PortalEventReaction>(`/portal/events/${encodeURIComponent(slug)}/like`);
        return res.data;
    },

    async reviewEvent(slug: string, payload: { rating: number; title?: string; comment: string }) {
        const res = await api.post(`/portal/events/${encodeURIComponent(slug)}/reviews`, payload);
        return res.data;
    },

    logout() {
        tokenStore.clear();
    },
};
