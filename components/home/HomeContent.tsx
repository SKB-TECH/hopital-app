"use client";

import { useMemo } from "react";
import { useGetPublicEvents } from "@/shared/hooks/public-event.hooks";
import FeaturedHighlights from "@/components/home/FeaturedHighlights";
import TrendingEvents from "@/components/home/TrendingEvents";
import CategoriesSection from "@/components/home/CategoriesSection";
import EventsNearYou from "@/components/home/EventsNearYou";
import TopCities from "@/components/home/TopCities";
import NewsletterSection from "@/components/home/NewsletterSection";
import Footer from "@/components/home/Footer";

export default function HomeContent() {
    const { data, isLoading, isError } = useGetPublicEvents({
        page: 1,
        limit: 12,
    });

    const events = data?.events ?? [];

    const categories = useMemo(() => {
        const map = new Map();

        events.forEach((event) => {
            if (event.category) {
                map.set(event.category.id, event.category);
            }
        });

        return Array.from(map.values());
    }, [events]);

    const cities = useMemo(() => {
        const map = new Map();

        events.forEach((event) => {
            if (event.venue?.city) {
                const city = event.venue.city;

                map.set(city, {
                    id: city,
                    name: city,
                    eventsCount: (map.get(city)?.eventsCount || 0) + 1,
                    image: event.bannerUrl,
                });
            }
        });

        return Array.from(map.values());
    }, [events]);

    if (isLoading) {
        return (
            <div className="mx-auto max-w-7xl px-6 py-20 text-center">
                Chargement des événements...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="mx-auto max-w-7xl px-6 py-20 text-center text-red-500">
                Impossible de charger les événements.
            </div>
        );
    }

    return (
        <>
            <FeaturedHighlights events={events.slice(0, 2)} />
            <TrendingEvents events={events.slice(0, 4)} />
            <CategoriesSection categories={categories} />
            <EventsNearYou events={events.slice(0, 3)} />
            <TopCities cities={cities} />
            <NewsletterSection />
            <Footer />
        </>
    );
}
