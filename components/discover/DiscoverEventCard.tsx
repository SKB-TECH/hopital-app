"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import type { PublicEvent } from "@/shared/types/public-event.types";
import Link from "next/link";
import { useLocalizedPath } from "@/shared/hooks/useLocalizedPath";

type Props = {
    event: PublicEvent;
};

function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    }).format(new Date(date));
}

export default function DiscoverEventCard({ event }: Props) {
    const { getLocalizedHref } = useLocalizedPath();

    return (
        <Link
            href={getLocalizedHref(`/events/${event.slug}`)}
            className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
        >
            <div className="relative h-44 overflow-hidden">
                <Image
                    src={event.bannerUrl || "/images/heroo.png"}
                    alt={event.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                />

                <span className="absolute left-5 top-5 rounded-full bg-white px-4 py-2 text-xs font-extrabold uppercase text-[#0067A8]">
          {event.category?.name}
        </span>
            </div>

            <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
          <span className="rounded bg-[#E7F3FB] px-3 py-1 text-xs font-bold text-[#27B7F5]">
            {formatDate(event.startAt)}
          </span>

                    <span className="font-extrabold text-[#8B3F0A]">
            {event.minPrice ? `${event.minPrice} ${event.currency}` : "Free"}
          </span>
                </div>

                <h3 className="line-clamp-2 text-2xl font-extrabold leading-tight text-[#131827]">
                    {event.title}
                </h3>

                <p className="mt-5 flex items-center gap-2 text-gray-600">
                    <MapPin className="h-5 w-5" />
                    {event.venue?.city}, {event.venue?.country}
                </p>
            </div>
        </Link>
    );
}
