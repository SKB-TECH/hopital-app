"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import Nav from "@/components/home/Nav";
import Footer from "@/components/home/Footer";
import DiscoverSearchBar from "@/components/discover/DiscoverSearchBar";
import DiscoverFilters from "@/components/discover/DiscoverFilters";
import DiscoverEventsGrid from "@/components/discover/DiscoverEventsGrid";
import DiscoverPagination from "@/components/discover/DiscoverPagination";

import { useGetPublicEvents } from "@/shared/hooks/public-event.hooks";
import type { PublicEvent } from "@/shared/types/public-event.types";
import type { DateFilter } from "@/components/discover/DiscoverFilters";

export default function DiscoverPage() {
    const t = useTranslations("discover");

    const [page, setPage] = useState(1);
    const [q, setQ] = useState("");
    const [city, setCity] = useState("");
    const [category, setCategory] = useState("");
    const [dateFilter, setDateFilter] = useState<DateFilter>("");
    const [maxPrice, setMaxPrice] = useState<number | undefined>();
    const [distance, setDistance] = useState<number | undefined>(10);

    const publicEventsQuery = useGetPublicEvents({
        page,
        limit: 12,
        q: q.trim() || undefined,
        city: city.trim() || undefined,
        category: category || undefined,
        dateFilter: dateFilter || undefined,
        maxPrice,
        distance,
    });

    const events: PublicEvent[] = publicEventsQuery.data?.events ?? [];
    const isLoading = publicEventsQuery.isLoading;
    const isError = publicEventsQuery.isError;

    const categories = useMemo(() => {
        const allEvents = publicEventsQuery.data?.events ?? [];
        const map = new Map<string, PublicEvent["category"]>();

        allEvents.forEach((event) => {
            if (event.category?.id) {
                map.set(event.category.id, event.category);
            }
        });

        return Array.from(map.values()).filter(Boolean);
    }, [publicEventsQuery.data?.events]);

    const total = publicEventsQuery.data?.total ?? events.length;
    const pages = publicEventsQuery.data?.pages ?? 1;

    const handleSearch = (nextQ: string, nextCity: string) => {
        setQ(nextQ.trim());
        setCity(nextCity.trim());
        setPage(1);
    };

    const resetFilters = () => {
        setQ("");
        setCity("");
        setCategory("");
        setDateFilter("");
        setMaxPrice(undefined);
        setDistance(10);
        setPage(1);
    };

    return (
        <main className="min-h-screen bg-[#F5F7FC]">
          <Nav/>
            <section className="mx-auto max-w-7xl px-6 py-14 md:px-10">
                <h1 className="text-4xl font-extrabold tracking-[-0.04em] text-[#131827] md:text-5xl">
                    {t("title")}
                </h1>

                <DiscoverSearchBar
                    defaultQ={q}
                    defaultCity={city}
                    onSearch={handleSearch}
                />

                <div className="mt-12 grid gap-8 lg:grid-cols-[260px_1fr]">
                    <DiscoverFilters
                        categories={categories}
                        selectedCategory={category}
                        onCategoryChange={(value) => {
                            setCategory(value);
                            setPage(1);
                        }}
                        selectedDateFilter={dateFilter}
                        onDateFilterChange={(value) => {
                            setDateFilter(value);
                            setPage(1);
                        }}
                        maxPrice={maxPrice}
                        onMaxPriceChange={(value) => {
                            setMaxPrice(value);
                            setPage(1);
                        }}
                        distance={distance}
                        onDistanceChange={(value) => {
                            setDistance(value);
                            setPage(1);
                        }}
                        onReset={resetFilters}
                    />

                    <div>
                        <div className="mb-8 flex items-center justify-between">
                            <p className="text-gray-600">
                                {t("showing")}{" "}
                                <span className="font-bold text-[#131827]">{total}</span>{" "}
                                {t("events")}
                            </p>

                            <select className="rounded-xl border bg-white px-4 py-2 text-sm outline-none">
                                <option>{t("relevance")}</option>
                            </select>
                        </div>

                        <DiscoverEventsGrid
                            events={events}
                            isLoading={isLoading}
                            isError={isError}
                        />

                        <DiscoverPagination page={page} pages={pages} onChange={setPage} />
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
