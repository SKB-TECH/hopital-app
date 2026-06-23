"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { Link } from "@/i18n/navigation";
import { api } from "@/shared/lib/http/api";

type CalendarEventRow = {
  id: string;
  title: string;
  description: string;
  date: string;
  fullDate: string;
  time: string;
  location: string;
  status: "published" | "draft" | "cancelled";
};

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarsPage() {
  const t = useTranslations("calendarAdmin");
  const { isCollapsed } = useSidebar();
  const [month, setMonth] = useState(monthKey(new Date()));
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [events, setEvents] = useState<CalendarEventRow[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const calendarDays = useMemo(() => buildMonthDays(month), [month]);
  const monthLabel = useMemo(() => formatMonth(month), [month]);

  const loadCalendar = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/dashboard/calendar", { params: { month } });
      setEvents(normalizeCalendarEvents(response.data));
    } catch (err: any) {
      setError(err?.response?.data?.message?.[0] ?? err?.response?.data?.message ?? t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, [month]);

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, CalendarEventRow[]>>((acc, event) => {
      acc[event.fullDate] = [...(acc[event.fullDate] ?? []), event];
      return acc;
    }, {});
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const now = todayKey();
    return events.filter((event) => event.fullDate >= now && event.status !== "draft").sort((a, b) => a.fullDate.localeCompare(b.fullDate));
  }, [events]);

  const draftEvents = useMemo(() => events.filter((event) => event.status === "draft"), [events]);

  const goToPreviousMonth = () => setMonth(shiftMonth(month, -1));
  const goToNextMonth = () => setMonth(shiftMonth(month, 1));
  const goToToday = () => {
    const today = new Date();
    setMonth(monthKey(today));
    setSelectedDate(dateKey(today));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar />

      <div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"}`}>
        <DashboardNavbar />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-950">{t("title")}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {t("breadcrumbHome")} / <span className="font-medium text-slate-900">{t("title")}</span>
              </p>
            </div>

            <Link href="/events/create" className="inline-flex items-center gap-2 rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
              <Plus className="size-4" />
              {t("addEvent")}
            </Link>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded border border-slate-200 bg-white">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950">{monthLabel}</h2>
                  <p className="mt-1 text-sm text-slate-500">{t("monthDescription")}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="month"
                    value={month}
                    onChange={(event) => setMonth(event.target.value)}
                    className="h-10 rounded border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                  />
                  <button onClick={goToPreviousMonth} className="flex size-10 items-center justify-center rounded border border-slate-200 transition-colors hover:bg-slate-50">
                    <ChevronLeft className="size-4 text-slate-500" />
                  </button>
                  <button onClick={goToToday} className="h-10 rounded border border-slate-200 px-4 text-sm font-semibold transition-colors hover:bg-slate-50">
                    {t("today")}
                  </button>
                  <button onClick={goToNextMonth} className="flex size-10 items-center justify-center rounded border border-slate-200 transition-colors hover:bg-slate-50">
                    <ChevronRight className="size-4 text-slate-500" />
                  </button>
                  <button onClick={loadCalendar} className="flex size-10 items-center justify-center rounded border border-slate-200 transition-colors hover:bg-slate-50" title={t("refresh")}>
                    <RefreshCw className="size-4 text-slate-500" />
                  </button>
                </div>
              </div>

              {error && (
                <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700">
                  {error}
                </div>
              )}

              <div className="overflow-x-auto p-5">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-7 overflow-hidden rounded border border-slate-200">
                    {WEEK_DAYS.map((day) => (
                      <div key={day} className="border-r border-slate-200 bg-slate-50 p-3 text-center text-sm font-semibold text-slate-500 last:border-r-0">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 overflow-hidden rounded border border-t-0 border-slate-200">
                    {calendarDays.map((day) => {
                      const eventsOnDate = eventsByDate[day.fullDate] ?? [];
                      return (
                        <div
                          key={day.fullDate}
                          className={`min-h-[122px] border-r border-t border-slate-200 p-2 transition-colors last:border-r-0 hover:bg-slate-50 ${day.inMonth ? "bg-white" : "bg-slate-50/80"}`}
                        >
                          <button
                            onClick={() => setSelectedDate(day.fullDate)}
                            className={`mb-2 inline-flex size-7 items-center justify-center rounded text-xs font-semibold transition-colors ${
                              selectedDate === day.fullDate
                                ? "bg-blue-600 text-white"
                                : day.inMonth
                                  ? "text-slate-700 hover:bg-slate-100"
                                  : "text-slate-400 hover:bg-slate-100"
                            }`}
                          >
                            {day.date}
                          </button>

                          <div className="space-y-1">
                            {loading && eventsOnDate.length === 0 ? (
                              <div className="h-7 rounded bg-slate-100" />
                            ) : eventsOnDate.slice(0, 3).map((event) => (
                              <CalendarEvent key={event.id} title={event.title} variant={event.status} onClick={() => setSelectedEvent(event)} />
                            ))}
                            {eventsOnDate.length > 3 && <p className="text-xs font-semibold text-slate-400">+{eventsOnDate.length - 3}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded border border-slate-200 bg-white">
                <div className="border-b border-slate-100 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{t("upcomingTitle")}</h2>
                      <p className="mt-1 text-sm text-slate-500">{t("upcomingDescription")}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                      {upcomingEvents.length} {t("upcoming")}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {loading ? (
                    <LoadingBlock />
                  ) : upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => <EventCard key={event.id} event={event} onView={() => setSelectedEvent(event)} t={t} />)
                  ) : (
                    <EmptyBlock label={t("emptyUpcoming")} />
                  )}
                </div>
              </section>

              {draftEvents.length > 0 && (
                <section className="rounded border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">{t("draftTitle")}</h2>
                        <p className="mt-1 text-sm text-slate-500">{t("draftDescription")}</p>
                      </div>
                      <AlertCircle className="size-5 text-amber-500" />
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {draftEvents.map((event) => <EventCard key={event.id} event={event} onView={() => setSelectedEvent(event)} t={t} />)}
                  </div>
                </section>
              )}

              <section className="rounded bg-blue-600 p-5 text-white">
                <h3 className="mb-2 text-sm font-semibold text-white/80">{t("totalEvents")}</h3>
                <p className="mb-1 text-3xl font-bold">{events.length}</p>
                <p className="text-sm text-white/75">
                  {upcomingEvents.length} {t("upcoming")} / {draftEvents.length} {t("draft")}
                </p>
              </section>
            </aside>
          </div>
        </main>
      </div>

      {selectedEvent && <ViewEventModal t={t} event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}

function CalendarEvent({ title, variant = "published", onClick }: { title: string; variant?: CalendarEventRow["status"]; onClick?: () => void }) {
  const colors = variant === "draft"
    ? "bg-sky-50 text-sky-700 hover:bg-sky-100"
    : variant === "cancelled"
      ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
      : "bg-blue-50 text-blue-700 hover:bg-blue-100";

  return (
    <button onClick={onClick} className={`w-full truncate rounded px-2 py-1.5 text-left text-xs font-semibold transition-colors ${colors}`}>
      {title}
    </button>
  );
}

function EventCard({ event, onView, t }: { event: CalendarEventRow; onView: () => void; t: any }) {
  return (
    <button type="button" className="w-full p-4 text-left transition-colors hover:bg-slate-50" onClick={onView}>
      <div className="border-l-4 border-blue-600 pl-3">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-sm font-extrabold text-slate-900">{event.title}</h3>
          <span className={`shrink-0 rounded border px-2 py-0.5 text-xs font-semibold ${statusClass(event.status)}`}>
            {statusLabel(event.status, t)}
          </span>
        </div>

        <div className="mt-2 space-y-1.5">
          <p className="flex items-center gap-2 text-xs text-slate-500"><CalendarDays className="size-3.5" />{event.date}</p>
          <p className="flex items-center gap-2 text-xs text-slate-500"><Clock className="size-3.5" />{event.time}</p>
          <p className="flex items-center gap-2 text-xs text-slate-500"><MapPin className="size-3.5" />{event.location || "-"}</p>
        </div>
      </div>
    </button>
  );
}

function ViewEventModal({ t, event, onClose }: { t: any; event: CalendarEventRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-extrabold text-slate-950">{event.title}</h2>
          <button onClick={onClose} className="flex size-9 items-center justify-center rounded border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <span className={`inline-flex rounded border px-3 py-1 text-xs font-semibold ${statusClass(event.status)}`}>
            {statusLabel(event.status, t)}
          </span>

          <Detail icon={<CalendarDays className="size-5 text-slate-400" />} label={t("date")} value={event.date} />
          <Detail icon={<Clock className="size-5 text-slate-400" />} label={t("time")} value={event.time} />
          <Detail icon={<MapPin className="size-5 text-slate-400" />} label={t("location")} value={event.location || "-"} />

          {event.description && (
            <div className="pt-2">
              <p className="mb-1 text-sm font-medium text-slate-500">{t("description")}</p>
              <p className="text-sm leading-6 text-slate-700">{stripHtml(event.description)}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="rounded border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="p-8 text-center">
      <Loader2 className="mx-auto mb-3 size-8 animate-spin text-blue-600" />
      <p className="text-sm font-semibold text-slate-500">Loading</p>
    </div>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="p-8 text-center">
      <CalendarDays className="mx-auto mb-3 size-12 text-slate-300" />
      <p className="text-slate-400">{label}</p>
    </div>
  );
}

function normalizeCalendarEvents(data: any): CalendarEventRow[] {
  const rows = calendarRows(data);
  return rows.map((row: any) => {
    const start = new Date(row.startAt ?? row.start ?? row.date);
    const end = new Date(row.endAt ?? row.end ?? row.startAt ?? row.date);
    const dayDate = row.calendarDate ? new Date(row.calendarDate) : null;
    const fullDate = dayDate && !Number.isNaN(dayDate.getTime())
      ? dateKey(dayDate)
      : Number.isNaN(start.getTime())
        ? String(row.fullDate ?? row.date ?? "").slice(0, 10)
        : dateKey(start);
    return {
      id: row.id,
      title: textValue(row.title),
      description: textValue(row.description),
      date: Number.isNaN(start.getTime()) ? fullDate : formatDate(start),
      fullDate,
      time: Number.isNaN(start.getTime()) ? "-" : `${formatTime(start)} - ${formatTime(end)}`,
      location: row.location ?? (row.venue ? [row.venue.name, row.venue.city, row.venue.country].filter(Boolean).join(", ") : ""),
      status: eventStatus(row.status),
    };
  }).filter((event: CalendarEventRow) => event.id && event.fullDate);
}

function calendarRows(data: any) {
  const raw = data?.data ?? data ?? {};
  if (Array.isArray(raw?.days)) {
    return raw.days.flatMap((day: any) =>
      (Array.isArray(day.events) ? day.events : []).map((event: any) => ({
        ...event,
        calendarDate: day.date,
      }))
    );
  }
  if (Array.isArray(raw?.events)) return raw.events;
  if (Array.isArray(raw?.upcomingEvents) || Array.isArray(raw?.draftEvents)) {
    return [...(raw.upcomingEvents ?? []), ...(raw.draftEvents ?? [])];
  }
  if (Array.isArray(raw)) return raw;
  return [];
}

function buildMonthDays(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, monthNumber - 1, 1 - startOffset);

  return Array.from({ length: 42 }).map((_, index) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + index);
    return {
      date: day.getDate(),
      fullDate: dateKey(day),
      inMonth: day.getMonth() === monthNumber - 1,
    };
  });
}

function eventStatus(status: string): CalendarEventRow["status"] {
  const value = String(status ?? "DRAFT").toLowerCase();
  if (value === "published" || value === "upcoming") return "published";
  if (value === "cancelled" || value === "canceled" || value === "suspended") return "cancelled";
  return "draft";
}

function statusClass(status: CalendarEventRow["status"]) {
  if (status === "draft") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "cancelled") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function statusLabel(status: CalendarEventRow["status"], t: any) {
  if (status === "draft") return t("draft");
  if (status === "cancelled") return t("cancelled");
  return t("upcoming");
}

function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  return monthKey(new Date(year, monthNumber - 1 + offset, 1));
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function todayKey() {
  return dateKey(new Date());
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(year, monthNumber - 1, 1));
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
}

function textValue(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.fr ?? value.en ?? value.name ?? value.title ?? "";
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}
