import type { PublicMarketplaceItem } from "@/shared/types/marketplace.types";

export type PublicCategory = {
    id: string;
    name: string;
    slug: string;
};

export type PublicVenue = {
    id: string;
    name: string;
    address: string;
    city: string;
    country: string;
};

export type PublicOrganizer = {
    id: string;
    displayName: string;
    description: string | null;
    isVerified: boolean;
};

export type PublicTicketType = {
    id: string;
    name: string;
    price: number;
    currency: string;
    quantity: number;
    saleStartAt: string | null;
    saleEndAt: string | null;
};

export type PublicEvent = {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    description?: string | null;
    bannerUrl: string;
    type: "PHYSICAL" | "ONLINE" | "HYBRID";
    startAt: string;
    endAt: string;
    timezone: string;
    capacity: number;
    category: PublicCategory;
    venue: PublicVenue;
    organizer: PublicOrganizer;
    ticketTypes: PublicTicketType[];
    mediaFiles: unknown[];
    marketplaceItems?: PublicMarketplaceItem[];
    likeCount?: number;
    reviewCount?: number;
    minPrice: number;
    currency: string;
};

export type PublicEventsResponse = {
    data: PublicEvent[];
    page: number;
    limit: number;
    total: number;
    pages: number;
};

export type PublicPromotion = {
    id: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    isActive?: boolean;
};

export type PublicHeroPhoto = {
    id: string;
    title?: string | null;
    imageUrl: string;
    eventId?: string | null;
    eventSlug?: string | null;
};

export type PublicReview = {
    id: string;
    attendeeName: string;
    attendeeEmail?: string | null;
    eventName: string;
    rating: number;
    title?: string | null;
    comment: string;
    reviewText: string;
    visibility: "public" | "hidden";
    helpful: number;
    date: string;
    createdAt: string;
};

export type PublicReviewsResponse = {
    data: PublicReview[];
    page: number;
    limit: number;
    total: number;
    pages: number;
};

export type GetPublicEventsParams = {
    page?: number;
    limit?: number;
    q?: string;
    category?: string;
    city?: string;
    dateFilter?: "today" | "weekend" | "next-week";
    maxPrice?: number;
    distance?: number;
};
