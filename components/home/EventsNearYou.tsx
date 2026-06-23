"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { PublicEvent } from "@/shared/types/public-event.types";
import Link from "next/link";
import { useLocalizedPath } from "@/shared/hooks/useLocalizedPath";

type Props = {
    events: PublicEvent[];
};

function formatDate(date?: string) {
    if (!date) return "";
    return new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}

export default function EventsNearYou({ events }: Props) {
    const t = useTranslations("home.nearby");
    const { getLocalizedHref } = useLocalizedPath();

    if (!events.length) return null;

    const main = events[0];
    const side = events.slice(1, 3);

    return (
        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10">
            <div className="mb-8 flex items-center justify-between">
                <h2 className="text-3xl font-extrabold text-[#131827]">
                    {t("title")}
                </h2>

                <Link href={getLocalizedHref("/discover")} className="text-sm font-bold text-[#0067A8]">
                    {t("viewAll")}
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <article className="relative h-[520px] overflow-hidden rounded-2xl bg-black shadow-xl">
                    <Image
                        src={main.bannerUrl || "/images/heroo.png"}
                        alt={main.title}
                        fill
                        className="object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                    <div className="absolute bottom-8 left-8 max-w-xl text-white">
                        <h3 className="text-4xl font-extrabold">{main.title}</h3>

                        <p className="mt-3 text-white/80">{main.shortDescription}</p>

                        <p className="mt-2 text-sm text-white/70">
                            {main.venue?.city} • {formatDate(main.startAt)}
                        </p>

                        <Link
                            href={getLocalizedHref(`/events/${main.slug}`)}
                            className="mt-6 inline-flex rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#131827]"
                        >
                            {t("getTickets")}
                        </Link>
                    </div>
                </article>

                <div className="grid gap-6">
                    {side.map((event) => (
                        <article
                            key={event.id}
                            className="relative h-[247px] overflow-hidden rounded-2xl bg-black shadow-lg"
                        >
                            <Image
                                src={event.bannerUrl || "/images/heroo.png"}
                                alt={event.title}
                                fill
                                className="object-cover"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                            <div className="absolute bottom-5 left-5 text-white">
                                <h3 className="font-bold">{event.title}</h3>
                                <p className="mt-1 text-xs text-white/75">
                                    {event.venue?.city} • {formatDate(event.startAt)}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
