"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Globe,
  ImagePlus,
  Languages,
  ListChecks,
  Loader2,
  Plus,
  Save,
  Search,
  Ticket,
  Trash2,
  UploadCloud,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import RichTextEditor from "@/components/forms/RichTextEditor";
import { useSidebar } from "@/contexts/SidebarContext";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/shared/lib/http/api";

type Lang = "fr" | "en";
type EventStatus = "draft" | "published" | "cancelled";
type SelectOption = { id: string; name: string };
type TextMap = Record<Lang, string>;
type TicketForm = { name: TextMap; description: TextMap; price: string; currency: string; quantity: string };
type SessionForm = { title: TextMap; description: TextMap; startAt: string; endAt: string; speakerId: string; roomId: string };
type EventForm = {
  title: TextMap;
  shortDescription: TextMap;
  description: TextMap;
  slug: string;
  location: string;
  startAt: string;
  endAt: string;
  timezone: string;
  capacity: string;
  bannerUrl: string;
  bannerPublicId: string;
  organizerId: string;
  categoryId: string;
  venueId: string;
  type: "PHYSICAL" | "VIRTUAL" | "HYBRID";
  status: EventStatus;
  sponsorIds: string[];
  speakerIds: string[];
  ticketTypes: TicketForm[];
  sessions: SessionForm[];
};

const text = (): TextMap => ({ fr: "", en: "" });
const ticket = (): TicketForm => ({ name: text(), description: text(), price: "0", currency: "USD", quantity: "100" });
const session = (): SessionForm => ({ title: text(), description: text(), startAt: "", endAt: "", speakerId: "", roomId: "" });
const formDefaults = (): EventForm => ({
  title: text(),
  shortDescription: text(),
  description: text(),
  slug: "",
  location: "",
  startAt: "",
  endAt: "",
  timezone: "Africa/Kinshasa",
  capacity: "",
  bannerUrl: "",
  bannerPublicId: "",
  organizerId: "",
  categoryId: "",
  venueId: "",
  type: "PHYSICAL",
  status: "draft",
  sponsorIds: [],
  speakerIds: [],
  ticketTypes: [ticket()],
  sessions: [session()],
});

export default function CreateEventPage() {
  const t = useTranslations("eventsAdmin");
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [lang, setLang] = useState<Lang>("fr");
  const [form, setForm] = useState<EventForm>(formDefaults);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [sponsorQuery, setSponsorQuery] = useState("");
  const [options, setOptions] = useState({
    sponsors: [] as SelectOption[],
    speakers: [] as SelectOption[],
    organizers: [] as SelectOption[],
    categories: [] as SelectOption[],
    venues: [] as SelectOption[],
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [sponsors, speakers, organizers, categories, venues] = await Promise.all([
        loadOptions("/sponsors"),
        loadOptions("/speakers", "fullName"),
        loadOptions("/organizers", "displayName"),
        loadOptions("/event-categories"),
        loadOptions("/venues"),
      ]);
      if (mounted) {
        setOptions({ sponsors, speakers, organizers, categories, venues });
        setForm((current) => ({
          ...current,
          organizerId: current.organizerId || organizers[0]?.id || "",
          categoryId: current.categoryId || categories[0]?.id || "",
          venueId: current.venueId || venues[0]?.id || "",
        }));
      }
    };
    load().catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const filteredSponsors = useMemo(() => {
    const query = sponsorQuery.toLowerCase();
    return options.sponsors.filter((sponsor) => sponsor.name.toLowerCase().includes(query));
  }, [options.sponsors, sponsorQuery]);

  const setText = (field: "title" | "shortDescription" | "description", value: string) => {
    setForm((current) => ({ ...current, [field]: { ...current[field], [lang]: value } }));
  };

  const uploadToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      alert(t("cloudinary.missing"));
      return;
    }

    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    body.append("upload_preset", uploadPreset);
    body.append("folder", "kongo/events");

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "Cloudinary upload failed");
      setForm((current) => ({ ...current, bannerUrl: result.secure_url, bannerPublicId: result.public_id }));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!form.organizerId) {
      setError(t("errors.organizerRequired"));
      return;
    }
    setSaving(true);
    try {
      const created = await api.post("/events", eventPayload(form));
      const eventId = created.data?.id ?? created.data?.data?.id;
      if (eventId) {
        await Promise.all([
          ...form.sponsorIds.map((sponsorId) => api.post("/event-sponsors", { eventId, sponsorId })),
          ...form.speakerIds.map((speakerId) => api.post("/event-speakers", { eventId, speakerId })),
          ...form.ticketTypes.filter((item) => item.name.fr || item.name.en).map((item) => api.post("/ticket-types", ticketPayload(eventId, item))),
          ...form.sessions.filter((item) => item.title.fr || item.title.en).map((item) => api.post("/sessions", sessionPayload(eventId, item))),
        ]);
      }
      router.push("/events");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"}`}>
        <DashboardNavbar />
        <main className="p-4 sm:p-6 lg:p-8">
          <form onSubmit={submit} className="rounded border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <Link href="/events" className="mt-1 flex size-9 items-center justify-center rounded border border-slate-200 hover:bg-slate-50">
                  <ArrowLeft className="size-4" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-slate-950">{t("create.title")}</h1>
                  <p className="mt-1 text-sm text-slate-500">{t("form.subtitle")}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href="/events" className="inline-flex h-10 items-center justify-center rounded border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {t("cancel")}
                </Link>
                <button disabled={saving} className="inline-flex h-10 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  {t("create.submit")}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3">
              <Languages className="size-4 text-slate-500" />
              {(["fr", "en"] as Lang[]).map((item) => (
                <button key={item} type="button" onClick={() => setLang(item)} className={`rounded px-3 py-1.5 text-sm font-semibold ${lang === item ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {item.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              {error && (
                <div className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 xl:col-span-2">
                  {error}
                </div>
              )}
              <div className="space-y-5">
                <Panel title={t("sections.identity")} icon={<Globe className="size-4" />}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label={`${t("form.title")} ${lang.toUpperCase()}`} required>
                      <Input value={form.title[lang]} onChange={(event) => setText("title", event.target.value)} />
                    </Field>
                    <Field label={t("form.slug")} required>
                      <Input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="festival-kongo" />
                    </Field>
                  </div>
                  <Field label={`${t("form.shortDescription")} ${lang.toUpperCase()}`}>
                    <RichTextEditor value={form.shortDescription[lang]} onChange={(value) => setText("shortDescription", value)} minHeight="min-h-28" />
                  </Field>
                  <Field label={`${t("form.description")} ${lang.toUpperCase()}`} required>
                    <RichTextEditor value={form.description[lang]} onChange={(value) => setText("description", value)} minHeight="min-h-64" />
                  </Field>
                </Panel>

                <Panel title={t("sections.schedule")} icon={<CalendarDays className="size-4" />}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label={t("form.startAt")} required><Input type="datetime-local" value={form.startAt} onChange={(event) => setForm({ ...form, startAt: event.target.value })} /></Field>
                    <Field label={t("form.endAt")} required><Input type="datetime-local" value={form.endAt} onChange={(event) => setForm({ ...form, endAt: event.target.value })} /></Field>
                    <Field label={t("form.timezone")}><Input value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} /></Field>
                    <Field label={t("form.capacity")}><Input type="number" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} /></Field>
                  </div>
                </Panel>

                <Panel title={t("sections.tickets")} icon={<Ticket className="size-4" />}>
                  <DynamicList
                    items={form.ticketTypes}
                    addLabel={t("tickets.add")}
                    onAdd={() => setForm({ ...form, ticketTypes: [...form.ticketTypes, ticket()] })}
                    onRemove={(index) => setForm({ ...form, ticketTypes: form.ticketTypes.filter((_, itemIndex) => itemIndex !== index) })}
                    render={(item, index) => (
                      <div className="grid gap-3 md:grid-cols-4">
                        <Field label={`${t("tickets.name")} ${lang.toUpperCase()}`}><Input value={item.name[lang]} onChange={(event) => updateTicket(form, setForm, index, "name", lang, event.target.value)} /></Field>
                        <Field label={t("tickets.price")}><Input type="number" value={item.price} onChange={(event) => updateTicketSimple(form, setForm, index, "price", event.target.value)} /></Field>
                        <Field label={t("tickets.currency")}><Input value={item.currency} onChange={(event) => updateTicketSimple(form, setForm, index, "currency", event.target.value)} /></Field>
                        <Field label={t("tickets.quantity")}><Input type="number" value={item.quantity} onChange={(event) => updateTicketSimple(form, setForm, index, "quantity", event.target.value)} /></Field>
                      </div>
                    )}
                  />
                </Panel>

                <Panel title={t("sections.sessions")} icon={<ListChecks className="size-4" />}>
                  <DynamicList
                    items={form.sessions}
                    addLabel={t("sessions.add")}
                    onAdd={() => setForm({ ...form, sessions: [...form.sessions, session()] })}
                    onRemove={(index) => setForm({ ...form, sessions: form.sessions.filter((_, itemIndex) => itemIndex !== index) })}
                    render={(item, index) => (
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label={`${t("sessions.title")} ${lang.toUpperCase()}`}><Input value={item.title[lang]} onChange={(event) => updateSession(form, setForm, index, "title", lang, event.target.value)} /></Field>
                        <Field label={t("sessions.speakerId")}><Select value={item.speakerId} onChange={(value) => updateSessionSimple(form, setForm, index, "speakerId", value)}><option value="">-</option>{options.speakers.map((speaker) => <option key={speaker.id} value={speaker.id}>{speaker.name}</option>)}</Select></Field>
                        <Field label={t("sessions.startAt")}><Input type="datetime-local" value={item.startAt} onChange={(event) => updateSessionSimple(form, setForm, index, "startAt", event.target.value)} /></Field>
                        <Field label={t("sessions.endAt")}><Input type="datetime-local" value={item.endAt} onChange={(event) => updateSessionSimple(form, setForm, index, "endAt", event.target.value)} /></Field>
                      </div>
                    )}
                  />
                </Panel>
              </div>

              <aside className="space-y-5">
                <Panel title={t("sections.media")} icon={<ImagePlus className="size-4" />}>
                  <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:border-blue-500">
                    {uploading ? <Loader2 className="size-6 animate-spin text-blue-600" /> : <UploadCloud className="size-6 text-slate-500" />}
                    <span className="text-sm font-semibold text-slate-700">{uploading ? t("cloudinary.uploading") : t("cloudinary.drop")}</span>
                    <span className="text-xs text-slate-500">{t("cloudinary.only")}</span>
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadToCloudinary(event.target.files[0])} />
                  </label>
                  {form.bannerUrl && <img src={form.bannerUrl} alt="" className="aspect-video w-full rounded border border-slate-200 object-cover" />}
                  <Field label="Cloudinary URL"><Input value={form.bannerUrl} onChange={(event) => setForm({ ...form, bannerUrl: event.target.value })} /></Field>
                </Panel>

                <Panel title={t("sections.settings")} icon={<Save className="size-4" />}>
                  <Field label={t("form.organizerId")} required><Select value={form.organizerId} onChange={(value) => setForm({ ...form, organizerId: value })}><option value="">-</option>{options.organizers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
                  <Field label={t("form.categoryId")}><Select value={form.categoryId} onChange={(value) => setForm({ ...form, categoryId: value })}><option value="">-</option>{options.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
                  <Field label={t("form.venueId")}><Select value={form.venueId} onChange={(value) => setForm({ ...form, venueId: value })}><option value="">-</option>{options.venues.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t("form.type")}><Select value={form.type} onChange={(value) => setForm({ ...form, type: value as EventForm["type"] })}><option value="PHYSICAL">Physical</option><option value="VIRTUAL">Virtual</option><option value="HYBRID">Hybrid</option></Select></Field>
                    <Field label={t("table.status")}><Select value={form.status} onChange={(value) => setForm({ ...form, status: value as EventStatus })}><option value="draft">{t("status.draft")}</option><option value="published">{t("status.published")}</option><option value="cancelled">{t("status.cancelled")}</option></Select></Field>
                  </div>
                </Panel>

                <Panel title={t("sections.partners")} icon={<Users className="size-4" />}>
                  <Field label={t("form.sponsorIds")}>
                    <div className="rounded border border-slate-200">
                      <label className="flex h-10 items-center gap-2 border-b border-slate-200 px-3">
                        <Search className="size-4 text-slate-400" />
                        <input value={sponsorQuery} onChange={(event) => setSponsorQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder={t("search")} />
                      </label>
                      <div className="max-h-44 overflow-y-auto p-2">
                        {filteredSponsors.map((sponsor) => (
                          <label key={sponsor.id} className="flex items-center gap-2 rounded px-2 py-2 text-sm hover:bg-slate-50">
                            <input type="checkbox" checked={form.sponsorIds.includes(sponsor.id)} onChange={() => toggleId(form, setForm, "sponsorIds", sponsor.id)} className="rounded border-slate-300" />
                            {sponsor.name}
                          </label>
                        ))}
                        {filteredSponsors.length === 0 && <p className="px-2 py-3 text-sm text-slate-500">{t("empty.sponsors")}</p>}
                      </div>
                    </div>
                  </Field>
                  <Field label={t("form.speakerIds")}>
                    <Select value="" onChange={(value) => value && toggleId(form, setForm, "speakerIds", value)}>
                      <option value="">-</option>
                      {options.speakers.map((speaker) => <option key={speaker.id} value={speaker.id}>{speaker.name}</option>)}
                    </Select>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {form.speakerIds.map((id) => <Pill key={id} label={optionName(options.speakers, id)} onRemove={() => toggleId(form, setForm, "speakerIds", id)} />)}
                    </div>
                  </Field>
                </Panel>
              </aside>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

async function loadOptions(endpoint: string, nameKey = "name"): Promise<SelectOption[]> {
  const response = await api.get(endpoint);
  const rows = response.data?.data ?? response.data ?? [];
  return rows.map((row: any) => ({ id: row.id, name: row[nameKey] ?? row.name ?? row.title ?? row.email ?? row.id })).filter((row: SelectOption) => row.id);
}

function eventPayload(form: EventForm) {
  return {
    organizerId: form.organizerId,
    categoryId: form.categoryId || undefined,
    venueId: form.venueId || undefined,
    title: form.title.fr || form.title.en,
    slug: form.slug,
    shortDescription: form.shortDescription.fr || form.shortDescription.en,
    description: form.description.fr || form.description.en,
    bannerUrl: cloudinaryUrl(form.bannerUrl),
    type: form.type,
    status: form.status.toUpperCase(),
    startAt: new Date(form.startAt).toISOString(),
    endAt: new Date(form.endAt).toISOString(),
    timezone: form.timezone,
    capacity: form.capacity ? Number(form.capacity) : undefined,
  };
}

function ticketPayload(eventId: string, item: TicketForm) {
  return { eventId, name: item.name.fr || item.name.en, description: item.description.fr || item.description.en, price: Number(item.price || 0), currency: item.currency, quantity: Number(item.quantity || 0) };
}

function sessionPayload(eventId: string, item: SessionForm) {
  return { eventId, title: item.title.fr || item.title.en, description: item.description.fr || item.description.en, speakerId: item.speakerId || undefined, roomId: item.roomId || undefined, startAt: new Date(item.startAt).toISOString(), endAt: new Date(item.endAt).toISOString() };
}

function cloudinaryUrl(url: string) {
  if (!url) return undefined;
  if (!url.includes("cloudinary.com")) throw new Error("Cloudinary URL required");
  return url;
}

function optionName(options: SelectOption[], id: string) {
  return options.find((item) => item.id === id)?.name ?? id;
}

function toggleId(form: EventForm, setForm: (form: EventForm) => void, field: "sponsorIds" | "speakerIds", id: string) {
  const exists = form[field].includes(id);
  setForm({ ...form, [field]: exists ? form[field].filter((item) => item !== id) : [...form[field], id] });
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

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded border border-slate-200 p-4"><h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">{icon}{title}</h2><div className="space-y-4">{children}</div></section>;
}

function DynamicList<T>({ items, addLabel, render, onAdd, onRemove }: { items: T[]; addLabel: string; render: (item: T, index: number) => React.ReactNode; onAdd: () => void; onRemove: (index: number) => void }) {
  return <div className="space-y-3">{items.map((item, index) => <div key={index} className="rounded border border-slate-200 p-3"><div className="mb-3 flex justify-end"><button type="button" onClick={() => onRemove(index)} className="rounded border border-slate-200 p-1.5 hover:bg-rose-50"><Trash2 className="size-4 text-rose-500" /></button></div>{render(item, index)}</div>)}<button type="button" onClick={onAdd} className="inline-flex h-9 items-center gap-2 rounded border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Plus className="size-4" />{addLabel}</button></div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block space-y-2 text-sm font-semibold text-slate-700"><span>{label}{required && <span className="text-rose-500"> *</span>}</span>{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="h-10 w-full rounded border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />;
}

function Select({ children, value, onChange }: { children: React.ReactNode; value: string; onChange: (value: string) => void }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">{children}</select>;
}

function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return <button type="button" onClick={onRemove} className="rounded border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">{label} x</button>;
}
