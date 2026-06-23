export type PublicMarketplaceEvent = {
    id: string;
    title: string;
    slug: string;
    bannerUrl?: string | null;
    startAt?: string | null;
    venue?: {
        id?: string;
        name?: string | null;
        city?: string | null;
        country?: string | null;
    } | null;
};

export type PublicMarketplaceItem = {
    id: string;
    eventId?: string | null;
    name: string;
    description?: string | null;
    price: number;
    currency: string;
    imageUrl?: string | null;
    stock?: number | null;
    isActive: boolean;
    metadata?: Record<string, unknown> | null;
    createdAt?: string;
    updatedAt?: string;
    event?: PublicMarketplaceEvent | null;
};

export type PublicMarketplaceResponse = {
    data: PublicMarketplaceItem[];
    page: number;
    limit: number;
    total: number;
    pages: number;
};

export type GetPublicMarketplaceParams = {
    page?: number;
    limit?: number;
    q?: string;
    eventId?: string;
    eventSlug?: string;
};
