import Image from "next/image";
import { Calendar, Heart, MapPin, QrCode } from "lucide-react";
import { LocalizedLink } from "./LocalizedLink";
import type { PublicEvent } from "@/shared/types/public-event.types";

function formatDate(date?: string) {
  if (!date) return "Date à confirmer";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function EventCard({
  event,
  compact = false,
}: {
  event: PublicEvent;
  compact?: boolean;
}) {
  const price = event.minPrice ? `${event.minPrice.toLocaleString("fr-FR")} ${event.currency}` : "Gratuit";

  return (
    <LocalizedLink
      href={`/events/${event.slug}`}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className={`relative ${compact ? "h-40" : "h-56"} bg-slate-200`}>
        <Image
          src={event.bannerUrl || "/images/heroo.png"}
          alt={event.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-5 top-5 rounded-full bg-white px-4 py-2 text-xs font-extrabold uppercase text-[#005995]">
          {event.category?.name || "Event"}
        </span>
        <span className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#005995]">
          {price}
        </span>
      </div>
      <div className="p-6">
        <p className="mb-3 inline-flex rounded-md bg-[#E8F5FD] px-3 py-1 text-sm font-bold text-[#20AEEA]">
          {formatDate(event.startAt)}
        </p>
        <h3 className="line-clamp-2 text-2xl font-extrabold leading-tight text-slate-950">
          {event.title}
        </h3>
        <p className="mt-4 flex items-center gap-2 text-lg text-slate-600">
          <MapPin className="h-5 w-5" />
          {[event.venue?.city, event.venue?.name].filter(Boolean).join(", ")}
        </p>
      </div>
    </LocalizedLink>
  );
}

export function TicketListCard({
  ticket,
}: {
  ticket: {
    title: string;
    category: string;
    status: string;
    date: string;
    time: string;
    venue: string;
    image: string;
  };
}) {
  return (
    <article className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-[320px_1fr]">
      <div className="relative h-64 md:h-auto">
        <Image src={ticket.image} alt={ticket.title} fill className="object-cover" />
      </div>
      <div className="flex flex-col gap-5 p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full bg-[#DDF0FF] px-4 py-2 text-sm font-extrabold uppercase text-[#005995]">
              {ticket.category}
            </p>
            <span className="ml-3 text-sm font-semibold text-slate-500">
              • {ticket.status}
            </span>
            <h3 className="mt-4 text-3xl font-extrabold text-slate-950">
              {ticket.title}
            </h3>
            <p className="mt-3 flex items-center gap-2 text-lg text-slate-600">
              <Calendar className="h-5 w-5" />
              {ticket.date} • {ticket.time}
            </p>
            <p className="mt-2 flex items-center gap-2 text-lg text-slate-600">
              <MapPin className="h-5 w-5" />
              {ticket.venue}
            </p>
          </div>
          <div className="hidden rounded-lg bg-slate-100 p-3 md:block">
            <QrCode className="h-14 w-14 text-slate-700" />
          </div>
        </div>
        <div className="mt-auto flex flex-wrap gap-4">
          <button className="rounded-lg bg-[#005995] px-6 py-3 font-extrabold text-white">
            Download PDF
          </button>
          <button className="rounded-lg border border-slate-300 px-6 py-3 font-extrabold text-slate-800">
            View QR Code
          </button>
          <LocalizedLink href="/events/nebula-global-contemporary-music-arts-festival-2024" className="ml-auto inline-flex items-center font-extrabold text-[#005995]">
            Event Details
          </LocalizedLink>
        </div>
      </div>
    </article>
  );
}
