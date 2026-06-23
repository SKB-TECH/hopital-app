export type Event = {
    id: string;
    title?: string;
    name?: string;
};

export type EventsListResponse = {
    data: Event[];
    page: number;
    limit: number;
    total: number;
    pages: number;
};
