"use client";

import { useQuery } from "@tanstack/react-query";
import {publicService} from "@/shared/services/public-event.service";
import {GetPublicEventsParams} from "@/shared/types/public-event.types";


export function useGetPublicEvents(params?: GetPublicEventsParams) {
    return useQuery({
        queryKey: ["public-events", params],
        queryFn: () => publicService.getEvents(params),
        staleTime: 60 * 1000,
        select: (response) => ({
            events: response.data,
            page: response.page,
            limit: response.limit,
            total: response.total,
            pages: response.pages,
        }),
    });
}

export function useGetUpcomingPublicEvents(params?: GetPublicEventsParams) {
    return useQuery({
        queryKey: ["public-events-upcoming", params],
        queryFn: () => publicService.getUpcomingEvents(params),
        staleTime: 60 * 1000,
        select: (response) => ({
            events: response.data,
            page: response.page,
            limit: response.limit,
            total: response.total,
            pages: response.pages,
        }),
    });
}

export function useGetPublicEventBySlug(slug?: string) {
    return useQuery({
        queryKey: ["public-event", slug],
        queryFn: () => publicService.getEventBySlug(slug as string),
        enabled: !!slug,
        staleTime: 60 * 1000,
    });
}

export function useGetPublicPromotions() {
    return useQuery({
        queryKey: ["public-promotions"],
        queryFn: () => publicService.getPromotions(),
        staleTime: 60 * 1000,
    });
}

export function useGetPublicHeroPhotos() {
    return useQuery({
        queryKey: ["public-hero-photos"],
        queryFn: () => publicService.getHeroPhotos(),
        staleTime: 60 * 1000,
    });
}

export function useGetPublicEventReviews(slug?: string) {
    return useQuery({
        queryKey: ["public-event-reviews", slug],
        queryFn: () => publicService.getEventReviews(slug as string, { page: 1, limit: 10 }),
        enabled: !!slug,
        staleTime: 60 * 1000,
    });
}
