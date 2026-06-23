import { api } from "@/shared/lib/http/api";
import type { EventsListResponse } from "@/shared/types/event.types";

export const eventService = {
    async listEvents(params?: { page?: number; limit?: number }): Promise<EventsListResponse> {
        const res = await api.get<EventsListResponse>("/events", {
            params: {
                page: params?.page ?? 1,
                limit: params?.limit ?? 100,
            },
        });
        return res.data;
    },
};
