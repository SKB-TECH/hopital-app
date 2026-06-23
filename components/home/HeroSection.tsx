"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Calendar,
    Loader2,
    MapPin,
    Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useSearch } from "@/shared/hooks/search.hooks";
import { useLocalizedPath } from "@/shared/hooks/useLocalizedPath";

export default function HeroSection() {
    const t = useTranslations("home.hero");
    const router = useRouter();
    const { getLocalizedHref } = useLocalizedPath();

    const [q, setQ] = useState("");
    const [location, setLocation] = useState("");
    const [date, setDate] = useState("");

    const searchQuery = q.trim();

    const { data, isLoading } = useSearch(
        {
            q: searchQuery,
            type: "events",
            page: 1,
            limit: 5,
        },
        searchQuery.length >= 2
    );

    const results = useMemo(() => {
        return data?.results?.events?.data ?? [];
    }, [data]);

    const handleSubmit = () => {
        const params = new URLSearchParams();

        if (q.trim()) params.set("q", q.trim());
        if (location.trim()) params.set("location", location.trim());
        if (date.trim()) params.set("date", date.trim());

        router.push(getLocalizedHref(`/discover?${params.toString()}`));
    };

    return (
        <section className="relative z-30 min-h-[760px] overflow-visible bg-black text-white">
            <Image
                src="/images/heroo.png"
                alt="Kongo Event"
                fill
                priority
                className="object-cover object-center"
            />

            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-black/45" />
                <div className="absolute bottom-0 left-0 right-0 h-[360px] bg-gradient-to-t from-[#F5F7FC] via-[#F5F7FC]/80 to-transparent" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: "easeOut" }}
                className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pt-52 text-center"
            >
                <motion.h1
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="max-w-5xl text-5xl font-extrabold leading-tight md:text-7xl"
                >
                    {t("titleFirst")}
                    <br />
                    <span className="text-[#27B7F5]">{t("titleSecond")}</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.15 }}
                    className="mt-8 max-w-3xl text-lg leading-8 text-white/85"
                >
                    {t("subtitle")}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.65, delay: 0.25 }}
                    className="relative z-50 mt-14 w-full max-w-5xl"
                >
                    <div className="relative z-50 flex items-center rounded-full bg-white/95 p-4 shadow-2xl backdrop-blur-xl">
                        <div className="flex flex-1 items-center gap-4 px-4 text-gray-600">
                            <Search className="h-5 w-5 shrink-0 text-[#0067A8]" />

                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSubmit();
                                }}
                                placeholder={t("searchPlaceholder")}
                                className="w-full bg-transparent text-gray-700 outline-none placeholder:text-gray-500"
                            />

                            {isLoading && (
                                <Loader2 className="h-4 w-4 animate-spin text-[#0067A8]" />
                            )}
                        </div>

                        <div className="hidden h-8 w-px bg-gray-300 md:block" />

                        <div className="hidden flex-1 items-center gap-4 px-6 text-gray-600 md:flex">
                            <MapPin className="h-5 w-5 shrink-0 text-[#0067A8]" />
                            <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder={t("location")}
                                className="w-full bg-transparent text-gray-700 outline-none placeholder:text-gray-500"
                            />
                        </div>

                        <div className="hidden h-8 w-px bg-gray-300 md:block" />

                        <div className="hidden flex-1 items-center gap-4 px-6 text-gray-600 md:flex">
                            <Calendar className="h-5 w-5 shrink-0 text-[#0067A8]" />
                            <input
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                type="date"
                                className="w-full bg-transparent text-gray-700 outline-none"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0067A8] text-white transition hover:scale-105 hover:bg-[#00568D]"
                        >
                            <ArrowRight />
                        </button>
                    </div>

                    {searchQuery.length >= 2 && results.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute left-4 right-4 top-[82px] z-[80] mx-auto max-h-[360px] max-w-3xl overflow-y-auto rounded-2xl border border-slate-100 bg-white text-left shadow-2xl md:left-0 md:right-0"
                        >
                            {results.map((event) => (
                                <button
                                    key={event.id}
                                    onClick={() => router.push(getLocalizedHref(`/events/${event.slug}`))}
                                    className="flex w-full items-center gap-4 border-b px-5 py-4 text-left transition hover:bg-gray-50"
                                >
                                    <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-gray-200">
                                        <Image
                                            src={event.bannerUrl || "/images/heroo.png"}
                                            alt={event.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate font-bold text-gray-900">
                                            {event.title}
                                        </h3>
                                        <p className="truncate text-sm text-gray-500">
                                            {event.venue?.city} • {event.category?.name}
                                        </p>
                                    </div>

                                    <span className="text-sm font-bold text-[#0067A8]">
                    {event.minPrice} {event.currency}
                  </span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </section>
    );
}
