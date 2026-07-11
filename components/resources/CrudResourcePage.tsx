"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { api } from "@/shared/lib/http/api";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export type ResourceOption = { id: string; name: string };
export type ResourceField = {
  name: string;
  label: string;
  type?: "text" | "number" | "url" | "select" | "cloudinary" | "checkbox" | "datetime";
  required?: boolean;
  placeholder?: string;
  endpoint?: string;
  nameKey?: string;
};

type Props = {
  title: string;
  description: string;
  endpoint: string;
  fields: ResourceField[];
  columns: { key: string; label: string }[];
  createLabel: string;
  idFields?: string[];
  canUpdate?: boolean;
  openCreateOnLoad?: boolean;
};

export default function CrudResourcePage({
  title,
  description,
  endpoint,
  fields,
  columns,
  createLabel,
  idFields = ["id"],
  canUpdate = true,
  openCreateOnLoad = false,
}: Props) {
  const t = useTranslations("resourcesCrud");
  const { isCollapsed } = useSidebar();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [options, setOptions] = useState<Record<string, ResourceOption[]>>({});

  const loadRows = async () => {
    setLoading(true);
    try {
      const response = await api.get(endpoint);
      setRows(normalizeRows(response.data));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows().catch(() => setLoading(false));
  }, [endpoint]);

  useEffect(() => {
    const selectFields = fields.filter((field) => field.type === "select" && field.endpoint);
    if (!selectFields.length) return;
    let mounted = true;
    Promise.all(
      selectFields.map(async (field) => {
        const response = await api.get(field.endpoint as string);
        return [field.name, normalizeRows(response.data).map((row: any) => ({ id: row.id, name: optionLabel(row, field.nameKey) }))] as const;
      })
    )
      .then((entries) => {
        if (mounted) setOptions(Object.fromEntries(entries));
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [fields]);

  useEffect(() => {
    if (!openCreateOnLoad) return;
    if (searchParams.get("create") !== "1") return;
    setEditing(null);
    setForm(defaultForm(fields));
    setOpen(true);
  }, [openCreateOnLoad, searchParams, fields]);

  const filteredRows = useMemo(() => {
    const term = query.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(term));
  }, [query, rows]);

  const startCreate = () => {
    setEditing(null);
    setForm(defaultForm(fields));
    setOpen(true);
  };

  const startEdit = (row: any) => {
    setEditing(row);
    setForm(defaultForm(fields, row));
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = cleanPayload(form, fields);
      const path = resourcePath(endpoint, editing, idFields);
      if (editing && path) {
        await api.patch(path, payload);
      } else {
        await api.post(endpoint, payload);
      }
      await loadRows();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: any) => {
    const path = resourcePath(endpoint, row, idFields);
    if (!path) return;
    await api.delete(path);
    const key = rowKey(row, idFields);
    setRows((current) => current.filter((item) => rowKey(item, idFields) !== key));
  };

  const uploadToCloudinary = async (field: ResourceField, file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      alert("Configure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
      return;
    }
    setUploading(field.name);
    const body = new FormData();
    body.append("file", file);
    body.append("upload_preset", uploadPreset);
    body.append("folder", `kongo/${endpoint.replace(/^\//, "")}`);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || "Cloudinary upload failed");
      setForm((current) => ({ ...current, [field.name]: result.secure_url }));
    } finally {
      setUploading("");
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
              <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={loadRows} className="inline-flex h-10 items-center gap-2 rounded border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <RefreshCw className="size-4" />
                {t("actions.refresh")}
              </button>
              <button onClick={startCreate} className="inline-flex h-10 items-center gap-2 rounded bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
                <Plus className="size-4" />
                {createLabel}
              </button>
            </div>
          </div>

          <section className="rounded border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-4">
              <label className="flex h-10 max-w-md items-center gap-2 rounded border border-slate-200 px-3 focus-within:border-blue-500">
                <Search className="size-4 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search.placeholder")} className="w-full bg-transparent text-sm outline-none" />
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    {columns.map((column) => <Th key={column.key}>{column.label}</Th>)}
                    <Th>{t("table.actions")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-2 size-5 animate-spin" />{t("states.loading")}</td></tr>
                  ) : filteredRows.length ? (
                    filteredRows.map((row) => (
                      <tr key={rowKey(row, idFields)} className="border-b border-slate-100 hover:bg-slate-50">
                        {columns.map((column) => <td key={column.key} className="px-4 py-3 text-sm text-slate-700">{displayCell(row, column.key, options)}</td>)}
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {canUpdate && <button onClick={() => startEdit(row)} className="flex size-8 items-center justify-center rounded hover:bg-slate-100" title={t("actions.edit")}><Edit className="size-4" /></button>}
                            <button onClick={() => remove(row)} className="flex size-8 items-center justify-center rounded hover:bg-rose-50" title={t("actions.delete")}><Trash2 className="size-4 text-rose-500" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center text-sm text-slate-500">{t("states.noData")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 p-3">
          <form onSubmit={submit} className="flex h-full w-full max-w-xl flex-col overflow-hidden rounded border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-xl font-bold text-slate-950">{editing ? t("actions.edit") : createLabel}</h2>
              <button type="button" onClick={() => setOpen(false)} className="flex size-9 items-center justify-center rounded border border-slate-200 hover:bg-slate-50"><X className="size-4" /></button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {fields.map((field) => (
                <Field key={field.name} label={field.label} required={field.required}>
                  {field.type === "select" ? (
                    <Select value={form[field.name] ?? ""} onChange={(value) => setForm({ ...form, [field.name]: value })}>
                      <option value="">-</option>
                      {(options[field.name] ?? []).map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                    </Select>
                  ) : field.type === "checkbox" ? (
                    <label className="flex h-10 items-center gap-2 rounded border border-slate-200 px-3 text-sm font-semibold text-slate-700">
                      <input type="checkbox" checked={Boolean(form[field.name])} onChange={(event) => setForm({ ...form, [field.name]: event.target.checked })} className="rounded border-slate-300" />
                      {field.label}
                    </label>
                  ) : field.type === "cloudinary" ? (
                    <div className="space-y-2">
                      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:border-blue-500">
                        {uploading === field.name ? <Loader2 className="size-5 animate-spin text-blue-600" /> : <UploadCloud className="size-5 text-slate-500" />}
                        <span className="text-sm font-semibold text-slate-700">{t("upload.cloudinary")}</span>
                        <input type="file" accept="image/*,video/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadToCloudinary(field, event.target.files[0])} />
                      </label>
                      <Input value={form[field.name] ?? ""} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} placeholder={field.placeholder} />
                    </div>
                  ) : (
                    <Input type={field.type === "number" ? "number" : field.type === "datetime" ? "datetime-local" : "text"} value={form[field.name] ?? ""} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} placeholder={field.placeholder} />
                  )}
                </Field>
              ))}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
              <button type="button" onClick={() => setOpen(false)} className="h-10 rounded border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">{t("actions.cancel")}</button>
              <button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {t("actions.save")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function normalizeRows(data: any) {
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

function rowKey(row: any, idFields: string[]) {
  return idFields.map((field) => row?.[field]).filter(Boolean).join(":") || row?.id || JSON.stringify(row);
}

function resourcePath(endpoint: string, row: any, idFields: string[]) {
  const values = idFields.map((field) => row?.[field]).filter(Boolean);
  if (values.length !== idFields.length) return "";
  return `${endpoint}/${values.join("/")}`;
}

function defaultForm(fields: ResourceField[], row: any = {}) {
  return Object.fromEntries(fields.map((field) => {
    const value = row[field.name] ?? "";
    return [field.name, field.type === "datetime" ? toDateTimeLocalValue(value) : value];
  }));
}

function cleanPayload(form: Record<string, any>, fields: ResourceField[]) {
  const numericFields = new Set(fields.filter((field) => field.type === "number").map((field) => field.name));
  const dateTimeFields = new Set(fields.filter((field) => field.type === "datetime").map((field) => field.name));
  return Object.fromEntries(
    Object.entries(form)
      .filter(([, value]) => value !== "")
      .map(([key, value]) => {
        if (numericFields.has(key)) return [key, Number(value)];
        if (dateTimeFields.has(key)) return [key, new Date(String(value)).toISOString()];
        return [key, value];
      })
  );
}

function toDateTimeLocalValue(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function formatValue(value: any): string {
  if (value === null || value === undefined || value === "") return "-";
  if (isUuid(value)) return "Référence interne";
  if (Array.isArray(value)) {
    if (value.length && value.every(isUuid)) return `${value.length} référence${value.length > 1 ? "s" : ""} interne${value.length > 1 ? "s" : ""}`;
    return value.map(formatValue).filter((item) => item !== "-").join(", ") || "-";
  }
  if (typeof value === "object") return value.fr ?? value.en ?? value.name ?? displayText(value.title) ?? value.fullName ?? value.displayName ?? value.code ?? "-";
  return String(value);
}

function displayCell(row: any, key: string, options: Record<string, ResourceOption[]>) {
  const value = row?.[key];
  const option = options[key]?.find((item) => item.id === value);
  if (option) return option.name;
  const sibling = readableSiblingValue(row, key);
  if (sibling) return sibling;
  if (isTechnicalKey(key)) return "-";
  return formatValue(value);
}

function optionLabel(row: any, nameKey?: string) {
  return displayText(nameKey ? row[nameKey] : undefined)
    || displayText(row.name)
    || displayText(row.title)
    || displayText(row.metadata?.translations?.title)
    || row.fullName
    || row.displayName
    || row.email
    || "Référence";
}

function displayText(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.fr ?? value.en ?? value.name ?? value.title ?? "";
  return String(value);
}

function readableSiblingValue(row: any, key: string) {
  const base = key.replace(/(_id|_ids|Ids|Id)$/g, "");
  const candidates = [`${base}Name`, `${base}_name`, `${base}Label`, `${base}_label`, `${base}Title`, `${base}_title`, `${base}Code`, `${base}_code`];
  return candidates.map((candidate) => row?.[candidate]).find((value) => value !== undefined && value !== null && value !== "" && !isUuid(value));
}

function isTechnicalKey(key: string) {
  return key === "id" || key.endsWith("Id") || key.endsWith("Ids") || key.endsWith("_id") || key.endsWith("_ids");
}

function isUuid(value: any) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{children}</th>;
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
