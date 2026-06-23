import type { PublicEvent } from "@/shared/types/public-event.types";

export type SearchResourceType =
    | "all"
    | "events"
    | "venues"
    | "organizers"
    | "speakers"
    | "sessions"
    | "marketplace"
    | "exhibitors"
    | "sponsors"
    | "categories";

export type SearchParams = {
    q: string;
    type?: SearchResourceType;
    page?: number;
    limit?: number;
};

export type SearchGroup<T = unknown> = {
    data: T[];
    total: number;
};

export type SearchResponse = {
    q: string;
    type: SearchResourceType;
    page: number;
    limit: number;
    total: number;
    results: {
        events: SearchGroup<PublicEvent>;
        venues: SearchGroup;
        organizers: SearchGroup;
        speakers: SearchGroup;
        sessions: SearchGroup;
        marketplace: SearchGroup;
        exhibitors: SearchGroup;
        sponsors: SearchGroup;
        categories: SearchGroup;
    };
};
