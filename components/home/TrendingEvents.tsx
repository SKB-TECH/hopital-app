import Image from "next/image";
import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PublicEvent } from "@/shared/types/public-event.types";

type Props = {
    events: PublicEvent[];
};

function formatDate(date?: string) {
    if (!date) return "";
    return new Intl.DateTimeFormat("fr-FR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}

export default function TrendingEvents({ events }: Props) {
    const t = useTranslations("home.trending");

    if (!events.length) return null;

    return (
        <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
            <h2 className="text-3xl font-extrabold text-[#131827]">{t("title")}</h2>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {events.map((event) => (
                    <article key={event.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                        <div className="relative h-40">
                            <Image
                                src={event.bannerUrl || "/images/heroo.png"}
                                alt={event.title}
                                fill
                                className="object-cover"
                            />

                            <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0067A8]">
                {event.minPrice ? `${event.minPrice} ${event.currency}` : "Free"}
              </span>
                        </div>

                        <div className="p-4">
                            <p className="text-xs font-bold uppercase text-[#0067A8]">
                                {event.category?.name}
                            </p>

                            <h3 className="mt-2 line-clamp-2 font-bold text-[#131827]">
                                {event.title}
                            </h3>

                            <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="h-4 w-4" />
                                {formatDate(event.startAt)}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
