"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";

import {PublicEvent} from "@/shared/types/public-event.types";
import Link from "next/link";
import { useLocalizedPath } from "@/shared/hooks/useLocalizedPath";


type Props = {
    events: PublicEvent[];
};

function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
    }).format(new Date(date));
}

export default function RelatedEvents({ events }: Props) {
    const { getLocalizedHref } = useLocalizedPath();

    if (!events.length) return null;

    return (
        <section className="bg-[#EEF1F8] py-20">
            <div className="mx-auto max-w-7xl px-6">
                <div className="mb-10 flex items-end justify-between">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-widest text-[#0067A8]">
                            Curated for you
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-[#131827]">
                            More Events Like This
                        </h2>
                    </div>

                    <Link href={getLocalizedHref("/discover")} className="text-sm font-bold text-[#0067A8]">
                        View All →
                    </Link>
                </div>

                <div className="grid gap-7 md:grid-cols-3">
                    {events.map((event) => (
                        <Link
                            key={event.id}
                            href={getLocalizedHref(`/events/${event.slug}`)}
                            className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                        >
                            <div className="relative h-52">
                                <Image
                                    src={event.bannerUrl || "/images/heroo.png"}
                                    alt={event.title}
                                    fill
                                    className="object-cover"
                                />

                                <span className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#0067A8]">
                  From {event.minPrice} {event.currency}
                </span>
                            </div>

                            <div className="p-6">
                                <p className="text-xs text-gray-500">
                                    {formatDate(event.startAt)} · {event.category?.name}
                                </p>

                                <h3 className="mt-2 font-bold text-[#131827]">
                                    {event.title}
                                </h3>

                                <p className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="h-4 w-4" />
                                    {event.venue?.name}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
