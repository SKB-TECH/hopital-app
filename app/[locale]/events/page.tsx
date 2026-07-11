"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CircleDollarSign,
  Copy,
  Eye,
  FileImage,
  Filter,
  Globe,
  ImagePlus,
  Languages,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Ticket,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import RichTextEditor from "@/components/forms/RichTextEditor";
import { useSidebar } from "@/contexts/SidebarContext";
import { Link } from "@/i18n/navigation";
import { api } from "@/shared/lib/http/api";

type EventStatus = "published" | "draft" | "cancelled";
type Lang = "fr" | "en";

type EventRow = {
  id: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  shortDescription: Record<Lang, string>;
  location: string;
  startAt: string;
  endAt: string;
  status: EventStatus;
  type: "PHYSICAL" | "VIRTUAL" | "HYBRID";
  capacity: number;
  ticketsSold: number;
  revenue: number;
  bannerUrl: string;
  categoryId: string;
  venueId: string;
  organizerId: string;
  timezone: string;
  ticketTypes: TicketTypeForm[];
  sessions: SessionForm[];
  sponsorIds: string[];
  speakerIds: string[];
};

type TicketTypeForm = {
  name: Record<Lang, string>;
  description: Record<Lang, string>;
  price: string;
  currency: string;
  quantity: string;
};

type SessionForm = {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  startAt: string;
  endAt: string;
  speakerId: string;
  roomId: string;
};

type EventForm = Omit<EventRow, "id" | "ticketsSold" | "revenue"> & {
  slug: string;
  refundPolicy: Record<Lang, string>;
  bannerPublicId: string;
};

type RelationOption = { id: string; label: string };

const emptyText = { fr: "", en: "" };

const newTicket = (): TicketTypeForm => ({
  name: { ...emptyText },
  description: { ...emptyText },
  price: "0",
  currency: "USD",
  quantity: "100",
});

const newSession = (): SessionForm => ({
  title: { ...emptyText },
  description: { ...emptyText },
  startAt: "",
  endAt: "",
  speakerId: "",
  roomId: "",
});

const newEvent = (): EventForm => ({
  title: { ...emptyText },
  shortDescription: { ...emptyText },
  description: { ...emptyText },
  slug: "",
  location: "",
  startAt: "",
  endAt: "",
  status: "draft",
  type: "PHYSICAL",
  capacity: 0,
  bannerUrl: "",
  bannerPublicId: "",
  categoryId: "",
  venueId: "",
  organizerId: "",
  timezone: "Africa/Kinshasa",
  refundPolicy: { ...emptyText },
  ticketTypes: [newTicket()],
  sessions: [newSession()],
  sponsorIds: [],
  speakerIds: [],
});

export default function EventsPage() {
  const t = useTranslations("eventsAdmin");
  const { isCollapsed } = useSidebar();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<"date" | "title" | "sales">("date");
  const [drawer, setDrawer] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<EventRow | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/events");
      setEvents(normalizeEventRows(response.data));
    } catch (err: any) {
      setError(err?.response?.data?.message?.[0] ?? err?.response?.data?.message ?? "Unable to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filtered = useMemo(() => {
    return events
      .filter((event) => {
        const haystack = `${event.title.fr} ${event.title.en} ${event.location}`.toLowerCase();
        return haystack.includes(query.toLowerCase()) && (status === "all" || event.status === status);
      })
      .sort((a, b) => {
        if (sort === "title") return a.title.fr.localeCompare(b.title.fr);
        if (sort === "sales") return b.ticketsSold - a.ticketsSold;
        return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
      });
  }, [events, query, sort, status]);

  const metrics = useMemo(
    () => ({
      published: events.filter((event) => event.status === "published").length,
      draft: events.filter((event) => event.status === "draft").length,
      cancelled: events.filter((event) => event.status === "cancelled").length,
      revenue: events.reduce((sum, event) => sum + event.revenue, 0),
    }),
    [events]
  );

  const openEdit = (event: EventRow) => {
    setSelected(event);
    setDrawer("edit");
  };

  const duplicateEvent = async (event: EventRow) => {
    try {
      const payload = {
        ...eventListPayload(event),
        title: `${event.title.fr || event.title.en} copy`,
        slug: `${event.title.en || event.title.fr}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        status: "DRAFT",
      };
      const response = await api.post("/events", payload);
      const created = normalizeEventRows({ data: [response.data?.data ?? response.data] })[0];
      if (created) setEvents((current) => [created, ...current]);
    } catch (err: any) {
      setError(err?.response?.data?.message?.[0] ?? err?.response?.data?.message ?? "Unable to duplicate event.");
    }
  };

  const removeEvent = async (id: string) => {
    try {
      await api.delete(`/events/${id}`);
      setEvents((current) => current.filter((event) => event.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.message?.[0] ?? err?.response?.data?.message ?? "Unable to delete event.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"}`}>
        <DashboardNavbar />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-950">{t("title")}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {t("breadcrumbManagement")} / <span className="font-medium text-slate-900">{t("breadcrumbEvents")}</span>
              </p>
            </div>
            <Link href="/events/create" className="inline-flex h-10 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus className="size-4" />
              {t("createEvent")}
            </Link>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={<CalendarDays className="size-5" />} label={t("metrics.published")} value={metrics.published} />
            <MetricCard icon={<ListChecks className="size-5" />} label={t("metrics.draft")} value={metrics.draft} />
            <MetricCard icon={<X className="size-5" />} label={t("metrics.rejected")} value={metrics.cancelled} />
            <MetricCard icon={<CircleDollarSign className="size-5" />} label={t("metrics.revenue")} value={`$${metrics.revenue.toLocaleString()}`} />
          </div>

          <section className="rounded border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <h2 className="text-lg font-bold text-slate-900">{t("tableTitle")} ({filtered.length})</h2>
                <div className="grid gap-3 sm:grid-cols-[1fr_160px_160px]">
                  <label className="flex h-10 items-center gap-2 rounded border border-slate-200 px-3 focus-within:border-blue-500">
                    <Search className="size-4 text-slate-400" />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} className="w-full bg-transparent text-sm outline-none" />
                  </label>
                  <Select value={status} onChange={setStatus} icon={<Filter className="size-4" />}>
                    <option value="all">{t("filters.all")}</option>
                    <option value="published">{t("status.published")}</option>
                    <option value="draft">{t("status.draft")}</option>
                    <option value="cancelled">{t("status.cancelled")}</option>
                  </Select>
                  <Select value={sort} onChange={(value) => setSort(value as "date" | "title" | "sales")} icon={<ListChecks className="size-4" />}>
                    <option value="date">{t("sort.date")}</option>
                    <option value="title">{t("sort.title")}</option>
                    <option value="sales">{t("sort.sales")}</option>
                  </Select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {error && <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
              <table className="w-full min-w-[980px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <Th>{t("table.eventName")}</Th>
                    <Th>{t("table.dateTime")}</Th>
                    <Th>{t("table.status")}</Th>
                    <Th>{t("table.ticketsSold")}</Th>
                    <Th>{t("table.revenue")}</Th>
                    <Th>{t("table.actions")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm font-semibold text-slate-500">
                        <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                        Loading events
                      </td>
                    </tr>
                  ) : filtered.map((event) => (
                    <tr key={event.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-12 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-100">
                            {event.bannerUrl ? <img src={event.bannerUrl} alt="" className="h-full w-full object-cover" /> : <FileImage className="size-5 text-slate-400" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{event.title.fr || event.title.en}</p>
                            <p className="text-xs text-slate-500">{event.location || t("empty.location")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{formatDate(event.startAt)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded border px-2.5 py-1 text-xs font-semibold ${statusClass(event.status)}`}>{t(`status.${event.status}`)}</span>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">{event.ticketsSold}/{event.capacity}</td>
                      <td className="px-4 py-4 text-sm font-semibold text-emerald-700">${event.revenue.toLocaleString()}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <IconButton label={t("actions.view")} icon={<Eye className="size-4" />} />
                          <IconButton label={t("actions.edit")} icon={<Pencil className="size-4" />} onClick={() => openEdit(event)} />
                          <IconButton label={t("actions.duplicate")} icon={<Copy className="size-4" />} onClick={() => duplicateEvent(event)} />
                          <IconButton label={t("actions.delete")} icon={<Trash2 className="size-4 text-rose-500" />} onClick={() => removeEvent(event.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && filtered.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <CalendarDays className="size-10 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">{t("empty.events")}</p>
                  <Link href="/events/create" className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white">{t("createEvent")}</Link>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {drawer && (
        <EventDrawer
          mode={drawer}
          event={selected}
          t={t}
          onClose={() => setDrawer(null)}
          onSave={(payload) => {
            setDrawer(null);
            loadEvents();
          }}
        />
      )}
    </div>
  );
}

function EventDrawer({ mode, event, t, onClose, onSave }: { mode: "create" | "edit"; event: EventRow | null; t: any; onClose: () => void; onSave: (form: EventForm) => void }) {
  const [lang, setLang] = useState<Lang>("fr");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<EventForm>(() => (event ? fromEvent(event) : newEvent()));
  const [relationOptions, setRelationOptions] = useState<Record<string, RelationOption[]>>({});

  useEffect(() => {
    let mounted = true;
    Promise.all([
      relationOptionsFor("/organizers", "organizers"),
      relationOptionsFor("/categories", "categories"),
      relationOptionsFor("/venues", "venues"),
      relationOptionsFor("/speakers", "speakers"),
      relationOptionsFor("/sponsors", "sponsors"),
    ]).then((entries) => {
      if (mounted) setRelationOptions(Object.fromEntries(entries));
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  const updateText = (field: "title" | "shortDescription" | "description" | "refundPolicy", value: string) => {
    setForm((current) => ({ ...current, [field]: { ...current[field], [lang]: value } }));
  };

  const submit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = eventMutationPayload(form);
      if (mode === "create") await api.post("/events", payload);
      if (mode === "edit" && event) await api.patch(`/events/${event.id}`, payload);
      onSave(form);
    } catch (err: any) {
      setError(err?.response?.data?.message?.[0] ?? err?.response?.data?.message ?? t("errors.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      alert(t("cloudinary.missing"));
      return;
    }

    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);
    data.append("folder", "kongo/events");

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "Cloudinary upload failed");
      setForm((current) => ({ ...current, bannerUrl: result.secure_url, bannerPublicId: result.public_id }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 p-3">
      <form onSubmit={submit} className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{mode === "create" ? t("create.title") : t("update.title")}</h2>
            <p className="text-sm text-slate-500">{t("form.subtitle")}</p>
          </div>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded border border-slate-200 hover:bg-slate-50">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3">
          <Languages className="size-4 text-slate-500" />
          {(["fr", "en"] as Lang[]).map((item) => (
            <button key={item} type="button" onClick={() => setLang(item)} className={`rounded px-3 py-1.5 text-sm font-semibold ${lang === item ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {item.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
            {error && (
              <div className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 xl:col-span-2">
                {error}
              </div>
            )}
            <div className="space-y-5">
              <Panel title={t("sections.identity")} icon={<Globe className="size-4" />}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={`${t("form.title")} ${lang.toUpperCase()}`} required>
                    <Input value={form.title[lang]} onChange={(event) => updateText("title", event.target.value)} />
                  </Field>
                  <Field label={t("form.slug")} required>
                    <Input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="festival-kongo" />
                  </Field>
                </div>
                <Field label={`${t("form.shortDescription")} ${lang.toUpperCase()}`}>
                  <RichTextEditor value={form.shortDescription[lang]} onChange={(value) => updateText("shortDescription", value)} minHeight="min-h-28" />
                </Field>
                <Field label={`${t("form.description")} ${lang.toUpperCase()}`} required>
                  <RichTextEditor value={form.description[lang]} onChange={(value) => updateText("description", value)} minHeight="min-h-64" />
                </Field>
              </Panel>

              <Panel title={t("sections.schedule")} icon={<CalendarDays className="size-4" />}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t("form.startAt")} required><Input type="datetime-local" value={form.startAt} onChange={(event) => setForm({ ...form, startAt: event.target.value })} /></Field>
                  <Field label={t("form.endAt")} required><Input type="datetime-local" value={form.endAt} onChange={(event) => setForm({ ...form, endAt: event.target.value })} /></Field>
                  <Field label={t("form.timezone")}><Input value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} /></Field>
                  <Field label={t("form.capacity")}><Input type="number" value={form.capacity || ""} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} /></Field>
                </div>
              </Panel>

              <Panel title={t("sections.tickets")} icon={<Ticket className="size-4" />}>
                <DynamicList
                  items={form.ticketTypes}
                  addLabel={t("tickets.add")}
                  onAdd={() => setForm({ ...form, ticketTypes: [...form.ticketTypes, newTicket()] })}
                  onRemove={(index) => setForm({ ...form, ticketTypes: form.ticketTypes.filter((_, itemIndex) => itemIndex !== index) })}
                  render={(ticketType, index) => (
                    <div className="grid gap-3 md:grid-cols-4">
                      <Field label={`${t("tickets.name")} ${lang.toUpperCase()}`}><Input value={ticketType.name[lang]} onChange={(event) => updateTicket(form, setForm, index, "name", lang, event.target.value)} /></Field>
                      <Field label={t("tickets.price")}><Input type="number" value={ticketType.price} onChange={(event) => updateTicketSimple(form, setForm, index, "price", event.target.value)} /></Field>
                      <Field label={t("tickets.currency")}><Input value={ticketType.currency} onChange={(event) => updateTicketSimple(form, setForm, index, "currency", event.target.value)} /></Field>
                      <Field label={t("tickets.quantity")}><Input type="number" value={ticketType.quantity} onChange={(event) => updateTicketSimple(form, setForm, index, "quantity", event.target.value)} /></Field>
                    </div>
                  )}
                />
              </Panel>

              <Panel title={t("sections.sessions")} icon={<ListChecks className="size-4" />}>
                <DynamicList
                  items={form.sessions}
                  addLabel={t("sessions.add")}
                  onAdd={() => setForm({ ...form, sessions: [...form.sessions, newSession()] })}
                  onRemove={(index) => setForm({ ...form, sessions: form.sessions.filter((_, itemIndex) => itemIndex !== index) })}
                  render={(session, index) => (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label={`${t("sessions.title")} ${lang.toUpperCase()}`}><Input value={session.title[lang]} onChange={(event) => updateSession(form, setForm, index, "title", lang, event.target.value)} /></Field>
                      <Field label={t("sessions.speakerId")}><RelationSelect value={session.speakerId} options={relationOptions.speakers ?? []} onChange={(value) => updateSessionSimple(form, setForm, index, "speakerId", value)} /></Field>
                      <Field label={t("sessions.startAt")}><Input type="datetime-local" value={session.startAt} onChange={(event) => updateSessionSimple(form, setForm, index, "startAt", event.target.value)} /></Field>
                      <Field label={t("sessions.endAt")}><Input type="datetime-local" value={session.endAt} onChange={(event) => updateSessionSimple(form, setForm, index, "endAt", event.target.value)} /></Field>
                    </div>
                  )}
                />
              </Panel>
            </div>

            <div className="space-y-5">
              <Panel title={t("sections.media")} icon={<ImagePlus className="size-4" />}>
                <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:border-blue-500">
                  {uploading ? <Loader2 className="size-6 animate-spin text-blue-600" /> : <UploadCloud className="size-6 text-slate-500" />}
                  <span className="text-sm font-semibold text-slate-700">{uploading ? t("cloudinary.uploading") : t("cloudinary.drop")}</span>
                  <span className="text-xs text-slate-500">{t("cloudinary.only")}</span>
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadToCloudinary(event.target.files[0])} />
                </label>
                {form.bannerUrl && <img src={form.bannerUrl} alt="" className="mt-3 aspect-video w-full rounded border border-slate-200 object-cover" />}
                <Field label="Cloudinary URL"><Input value={form.bannerUrl} onChange={(event) => setForm({ ...form, bannerUrl: event.target.value })} /></Field>
              </Panel>

              <Panel title={t("sections.settings")} icon={<Save className="size-4" />}>
                <Field label={t("form.organizerId")} required><RelationSelect value={form.organizerId} options={relationOptions.organizers ?? []} onChange={(value) => setForm({ ...form, organizerId: value })} /></Field>
                <Field label={t("form.categoryId")}><RelationSelect value={form.categoryId} options={relationOptions.categories ?? []} onChange={(value) => setForm({ ...form, categoryId: value })} /></Field>
                <Field label={t("form.venueId")}><RelationSelect value={form.venueId} options={relationOptions.venues ?? []} onChange={(value) => setForm({ ...form, venueId: value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("form.type")}><Select value={form.type} onChange={(value) => setForm({ ...form, type: value as EventForm["type"] })}><option value="PHYSICAL">Physical</option><option value="VIRTUAL">Virtual</option><option value="HYBRID">Hybrid</option></Select></Field>
                  <Field label={t("table.status")}><Select value={form.status} onChange={(value) => setForm({ ...form, status: value as EventStatus })}><option value="draft">{t("status.draft")}</option><option value="published">{t("status.published")}</option><option value="cancelled">{t("status.cancelled")}</option></Select></Field>
                </div>
                <Field label={t("form.sponsorIds")}><RelationMultiSelect value={form.sponsorIds} options={relationOptions.sponsors ?? []} onChange={(value) => setForm({ ...form, sponsorIds: value })} /></Field>
                <Field label={t("form.speakerIds")}><RelationMultiSelect value={form.speakerIds} options={relationOptions.speakers ?? []} onChange={(value) => setForm({ ...form, speakerIds: value })} /></Field>
              </Panel>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose} className="inline-flex h-10 items-center justify-center rounded border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">{t("cancel")}</button>
          <button type="submit" disabled={saving} className="inline-flex h-10 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {mode === "create" ? t("create.submit") : t("update.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="mb-3 flex size-10 items-center justify-center rounded bg-blue-50 text-blue-600">{icon}</div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded border border-slate-200 p-4">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">{icon}{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function DynamicList<T>({ items, addLabel, render, onAdd, onRemove }: { items: T[]; addLabel: string; render: (item: T, index: number) => React.ReactNode; onAdd: () => void; onRemove: (index: number) => void }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded border border-slate-200 p-3">
          <div className="mb-3 flex justify-end">
            <button type="button" onClick={() => onRemove(index)} className="rounded border border-slate-200 p-1.5 hover:bg-rose-50"><Trash2 className="size-4 text-rose-500" /></button>
          </div>
          {render(item, index)}
        </div>
      ))}
      <button type="button" onClick={onAdd} className="inline-flex h-9 items-center gap-2 rounded border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Plus className="size-4" />{addLabel}</button>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block space-y-2 text-sm font-semibold text-slate-700"><span>{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="h-10 w-full rounded border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />;
}

function Select({ children, value, icon, onChange }: { children: React.ReactNode; value: string; icon?: React.ReactNode; onChange: (value: string) => void }) {
  return <label className="flex h-10 items-center gap-2 rounded border border-slate-200 bg-white px-3 text-sm text-slate-700">{icon}<select value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-transparent outline-none">{children}</select></label>;
}

function RelationSelect({ value, options, onChange }: { value: string; options: RelationOption[]; onChange: (value: string) => void }) {
  const hasCurrent = value && !options.some((option) => option.id === value);
  return (
    <Select value={value ?? ""} onChange={onChange}>
      <option value="">-</option>
      {hasCurrent ? <option value={value}>Référence actuelle</option> : null}
      {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
    </Select>
  );
}

function RelationMultiSelect({ value, options, onChange }: { value: string[]; options: RelationOption[]; onChange: (value: string[]) => void }) {
  const selected = new Set(value ?? []);
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };
  return (
    <div className="rounded border border-slate-200 bg-white p-2">
      <div className="max-h-40 overflow-y-auto">
        {options.length ? options.map((option) => (
          <label key={option.id} className="flex items-center gap-2 rounded px-2 py-2 text-sm hover:bg-slate-50">
            <input type="checkbox" checked={selected.has(option.id)} onChange={() => toggle(option.id)} className="rounded border-slate-300" />
            <span className="font-semibold text-slate-700">{option.label}</span>
          </label>
        )) : <p className="px-2 py-2 text-sm font-semibold text-slate-500">{selected.size ? `${selected.size} référence(s) actuelle(s)` : "Aucune option disponible"}</p>}
      </div>
    </div>
  );
}

async function relationOptionsFor(endpoint: string, key: string): Promise<[string, RelationOption[]]> {
  const response = await api.get(endpoint, { params: { limit: 500 } });
  const rows = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : [];
  return [key, rows.map((row: any) => ({ id: String(row.id ?? ""), label: relationOptionLabel(row) })).filter((option: RelationOption) => option.id)];
}

function relationOptionLabel(row: any) {
  const title = textMap(undefined, row.title);
  return row.name ?? title.fr ?? title.en ?? row.fullName ?? row.displayName ?? row.email ?? row.code ?? "Référence";
}

function IconButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return <button type="button" onClick={onClick} title={label} className="flex size-8 items-center justify-center rounded hover:bg-slate-100">{icon}</button>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{children}</th>;
}

function statusClass(status: EventStatus) {
  if (status === "published") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "cancelled") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function normalizeEventRows(data: any): EventRow[] {
  const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  return rows.map((row: any) => {
    const translations = row.metadata?.translations ?? {};
    const ticketTypes = Array.isArray(row.ticketTypes) ? row.ticketTypes : [];
    const tickets = Array.isArray(row.tickets) ? row.tickets : [];
    const mediaFiles = Array.isArray(row.mediaFiles) ? row.mediaFiles : [];
    const soldTickets = tickets.filter((ticket: any) => ["SOLD", "USED"].includes(String(ticket.status ?? "").toUpperCase())).length;
    const computedRevenue = ticketTypes.reduce((sum: number, ticketType: any) => {
      const sold = Array.isArray(ticketType.tickets)
        ? ticketType.tickets.filter((ticket: any) => ["SOLD", "USED"].includes(String(ticket.status ?? "").toUpperCase())).length
        : soldTickets;
      return sum + sold * Number(ticketType.price ?? 0);
    }, 0);

    return {
      id: row.id,
      title: textMap(translations.title, row.title),
      shortDescription: textMap(translations.shortDescription, row.shortDescription),
      description: textMap(translations.description, row.description),
      location: row.venue ? [row.venue.name, row.venue.city, row.venue.country].filter(Boolean).join(", ") : "",
      startAt: toLocalDateTime(row.startAt),
      endAt: toLocalDateTime(row.endAt),
      status: eventStatus(row.status),
      type: row.type ?? "PHYSICAL",
      capacity: Number(row.capacity ?? 0),
      ticketsSold: soldTickets,
      revenue: computedRevenue,
      bannerUrl: row.bannerUrl ?? mediaFiles.find((file: any) => String(file.type ?? "").toLowerCase().startsWith("image"))?.url ?? "",
      categoryId: row.categoryId ?? "",
      venueId: row.venueId ?? "",
      organizerId: row.organizerId ?? "",
      timezone: row.timezone ?? "Africa/Kinshasa",
      ticketTypes: ticketTypes.map((ticketType: any) => ({
        name: textMap(undefined, ticketType.name),
        description: textMap(undefined, ticketType.description),
        price: String(ticketType.price ?? 0),
        currency: ticketType.currency ?? "USD",
        quantity: String(ticketType.quantity ?? 0),
      })),
      sessions: Array.isArray(row.sessions)
        ? row.sessions.map((session: any) => ({
            title: textMap(undefined, session.title),
            description: textMap(undefined, session.description),
            startAt: toLocalDateTime(session.startAt),
            endAt: toLocalDateTime(session.endAt),
            speakerId: session.speakerId ?? "",
            roomId: session.roomId ?? "",
          }))
        : [],
      sponsorIds: Array.isArray(row.sponsors) ? row.sponsors.map((item: any) => item.sponsorId).filter(Boolean) : [],
      speakerIds: Array.isArray(row.speakers) ? row.speakers.map((item: any) => item.speakerId).filter(Boolean) : [],
    };
  });
}

function textMap(value: any, fallback = ""): Record<Lang, string> {
  if (value && typeof value === "object") return { fr: value.fr ?? fallback ?? "", en: value.en ?? fallback ?? "" };
  return { fr: fallback ?? "", en: fallback ?? "" };
}

function eventStatus(status: string): EventStatus {
  const normalized = String(status ?? "DRAFT").toLowerCase();
  if (normalized === "published") return "published";
  if (normalized === "cancelled" || normalized === "suspended") return "cancelled";
  return "draft";
}

function toLocalDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 16);
}

function eventListPayload(event: EventRow) {
  return {
    organizerId: event.organizerId,
    categoryId: event.categoryId || undefined,
    venueId: event.venueId || undefined,
    title: event.title.fr || event.title.en,
    slug: `${event.title.en || event.title.fr}-${event.id}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    shortDescription: event.shortDescription.fr || event.shortDescription.en,
    description: event.description.fr || event.description.en,
    bannerUrl: event.bannerUrl || undefined,
    type: event.type,
    status: event.status.toUpperCase(),
    startAt: new Date(event.startAt).toISOString(),
    endAt: new Date(event.endAt).toISOString(),
    timezone: event.timezone,
    capacity: event.capacity || undefined,
  };
}

function fromEvent(event: EventRow): EventForm {
  return { ...event, slug: event.title.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), refundPolicy: { ...emptyText }, bannerPublicId: "" };
}

function toEventRow(form: EventForm): Omit<EventRow, "id" | "ticketsSold" | "revenue"> {
  return {
    title: form.title,
    shortDescription: form.shortDescription,
    description: form.description,
    location: form.location,
    startAt: form.startAt,
    endAt: form.endAt,
    status: form.status,
    type: form.type,
    capacity: form.capacity,
    bannerUrl: form.bannerUrl,
    categoryId: form.categoryId,
    venueId: form.venueId,
    organizerId: form.organizerId,
    timezone: form.timezone,
    ticketTypes: form.ticketTypes,
    sessions: form.sessions,
    sponsorIds: form.sponsorIds,
    speakerIds: form.speakerIds,
  };
}

function eventMutationPayload(form: EventForm) {
  return {
    organizerId: form.organizerId,
    categoryId: form.categoryId || undefined,
    venueId: form.venueId || undefined,
    title: form.title.fr || form.title.en,
    slug: form.slug,
    shortDescription: form.shortDescription.fr || form.shortDescription.en,
    description: form.description.fr || form.description.en,
    bannerUrl: assertCloudinary(form.bannerUrl),
    type: form.type,
    status: form.status.toUpperCase(),
    startAt: new Date(form.startAt).toISOString(),
    endAt: new Date(form.endAt).toISOString(),
    timezone: form.timezone,
    capacity: form.capacity || undefined,
    refundPolicy: form.refundPolicy.fr || form.refundPolicy.en,
  };
}

function assertCloudinary(url: string) {
  if (!url) return undefined;
  if (!url.includes("cloudinary.com")) throw new Error("Files must use Cloudinary.");
  return url;
}

function toIds(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function updateTicket(form: EventForm, setForm: (form: EventForm) => void, index: number, field: "name" | "description", lang: Lang, value: string) {
  const next = [...form.ticketTypes];
  next[index] = { ...next[index], [field]: { ...next[index][field], [lang]: value } };
  setForm({ ...form, ticketTypes: next });
}

function updateTicketSimple(form: EventForm, setForm: (form: EventForm) => void, index: number, field: "price" | "currency" | "quantity", value: string) {
  const next = [...form.ticketTypes];
  next[index] = { ...next[index], [field]: value };
  setForm({ ...form, ticketTypes: next });
}

function updateSession(form: EventForm, setForm: (form: EventForm) => void, index: number, field: "title" | "description", lang: Lang, value: string) {
  const next = [...form.sessions];
  next[index] = { ...next[index], [field]: { ...next[index][field], [lang]: value } };
  setForm({ ...form, sessions: next });
}

function updateSessionSimple(form: EventForm, setForm: (form: EventForm) => void, index: number, field: "startAt" | "endAt" | "speakerId" | "roomId", value: string) {
  const next = [...form.sessions];
  next[index] = { ...next[index], [field]: value };
  setForm({ ...form, sessions: next });
}
