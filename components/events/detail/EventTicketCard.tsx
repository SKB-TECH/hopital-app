"use client";

import Link from "next/link";
import { Calendar, Heart, Info, MapPin, Share2 } from "lucide-react";
import {PublicEvent, PublicTicketType} from "@/shared/types/public-event.types";
import { useLocalizedPath } from "@/shared/hooks/useLocalizedPath";
import { useTranslations } from "next-intl";


type Props = {
    event: PublicEvent;
};

function formatDateRange(startAt: string, endAt: string) {
    const start = new Date(startAt);
    const end = new Date(endAt);

    const date = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
    }).format(start);

    const startTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(start);

    const endTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(end);

    return `${date} · ${startTime} - ${endTime}`;
}

export default function EventTicketCard({ event }: Props) {
    const t = useTranslations("eventDetail");
    const { getLocalizedHref } = useLocalizedPath();
    const tickets = event.ticketTypes ?? [];

    const lowestTicket = tickets.reduce<PublicTicketType | null>((lowest, item) => {
        if (!lowest) return item;
        return item.price < lowest.price ? item : lowest;
    }, null);

    return (
        <aside className="sticky top-28 h-fit rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                {t("priceStartingFrom")}
            </p>

            <div className="mt-3 text-4xl font-extrabold text-[#0067A8]">
                {event.minPrice ?? lowestTicket?.price ?? 0}{" "}
                <span className="text-base font-medium text-gray-500">
          {event.currency} / {t("perPerson")}
        </span>
            </div>

            <div className="mt-8 space-y-6">
                <InfoItem
                    icon={<Calendar className="h-5 w-5" />}
                    title={t("dateTime")}
                    value={formatDateRange(event.startAt, event.endAt)}
                />

                <InfoItem
                    icon={<MapPin className="h-5 w-5" />}
                    title={t("venue")}
                    value={`${event.venue?.name}, ${event.venue?.city}`}
                />
            </div>

            <div className="mt-8">
                <h3 className="mb-4 text-sm font-bold text-[#131827]">
                    {t("selectTickets")}
                </h3>

                <div className="space-y-3">
                    {tickets.map((ticket) => (
                        <button
                            key={ticket.id}
                            className="w-full rounded-xl border border-gray-300 p-4 text-left transition hover:border-[#0067A8]"
                        >
                            <div className="flex justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-[#131827]">{ticket.name}</h4>
                                    <p className="text-xs text-gray-500">
                                        {ticket.quantity} {t("available")}
                                    </p>
                                </div>

                                <span className="font-bold text-[#0067A8]">
                  {ticket.price} {ticket.currency}
                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <Link href={getLocalizedHref(`/checkout?event=${event.slug}`)} className="mt-8 block w-full rounded-xl bg-[#B55A00] px-6 py-4 text-center font-bold text-white transition hover:bg-[#944900]">
                {t("buyTicketsNow")}
            </Link>

            <p className="mt-5 text-center text-xs text-gray-500">
                {t("bookingNote")}
            </p>

            <div className="mt-8 flex justify-center gap-8 border-t pt-6 text-gray-600">
                <Share2 className="h-5 w-5" />
                <Heart className="h-5 w-5" />
                <Info className="h-5 w-5" />
            </div>
        </aside>
    );
}

function InfoItem({
                      icon,
                      title,
                      value,
                  }: {
    icon: React.ReactNode;
    title: string;
    value: string;
}) {
    return (
        <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F3FB] text-[#0067A8]">
                {icon}
            </div>

            <div>
                <h4 className="font-bold text-[#131827]">{title}</h4>
                <p className="mt-1 text-sm leading-6 text-gray-600">{value}</p>
            </div>
        </div>
    );
}
