import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PublicEvent } from "@/shared/types/public-event.types";

type Props = {
    events: PublicEvent[];
};

function formatEventDate(date?: string) {
    if (!date) return "";
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
    }).format(new Date(date));
}

export default function FeaturedHighlights({ events }: Props) {
    const t = useTranslations("home.featured");

    if (!events.length) return null;

    return (
        <section className="relative z-20 mx-auto -mt-24 max-w-7xl px-6 pb-20 md:px-10 mt-10">
            <div className="mb-7 flex items-end justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-[#131827] md:text-4xl">
                        {t("title")}
                    </h2>
                    <p className="mt-2 text-gray-600">{t("subtitle")}</p>
                </div>

                <div className="hidden items-center gap-3 md:flex">
                    <button className="flex h-12 w-12 items-center justify-center rounded-full border bg-white">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button className="flex h-12 w-12 items-center justify-center rounded-full border bg-white">
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {events.map((event) => (
                    <article
                        key={event.id}
                        className="group relative h-[390px] overflow-hidden rounded-2xl bg-black shadow-xl"
                    >
                        <Image
                            src={event.bannerUrl || "/images/heroo.png"}
                            alt={event.title}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />

                        <div className="absolute bottom-7 left-7 right-7">
              <span className="rounded-full bg-[#27B7F5] px-4 py-2 text-xs font-semibold text-white">
                {event.category?.name}
              </span>

                            <h3 className="mt-4 text-2xl font-bold text-white">
                                {event.title}
                            </h3>

                            <p className="mt-2 text-white/80">
                                {formatEventDate(event.startAt)} • {event.venue?.city}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
