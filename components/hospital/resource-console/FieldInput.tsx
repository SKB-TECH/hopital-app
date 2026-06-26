"use client";

import { useEffect, useState } from "react";
import type { HospitalField } from "@/shared/types/hospital.types";
import { api } from "@/shared/lib/http/api";
import Autocomplete, { type AutocompleteOption } from "@/components/ui/autocomplete";
import RichTextEditor from "@/components/forms/RichTextEditor";
import { formatValue, normalizeRows, relationLabel } from "./utils";
import { ModulePermissionsEditor } from "./ModulePermissionsEditor";

export function FieldInput({ field, value, onChange, locale = "fr", form }: { field: HospitalField; value: any; onChange: (value: any) => void; locale?: string; form?: Record<string, any> }) {
  const base = "w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white";
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!field.reference) return;
    let mounted = true;
    setLoading(true);
    api.get(field.reference.endpoint)
      .then((response) => {
        if (!mounted) return;
        setOptions(normalizeRows(response.data).map((row) => ({
          id: row.id,
          label: relationLabel(row, field.reference?.labelKeys ?? []),
          description: relationLabel(row, field.reference?.descriptionKeys ?? []),
        })).filter((option) => option.id));
      })
      .catch(() => mounted && setOptions([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [field.reference?.endpoint]);

  const datalistId = `list-${field.name}`;
  const selectedValues = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];

  return (
    <label className={field.type === "multiselect" || field.type === "module-permissions" ? "block md:col-span-2" : "block"}>
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{field.label}{field.required ? " *" : ""}</span>
      {field.type === "module-permissions" ? (
        <ModulePermissionsEditor value={value} roles={form?.roles} onChange={onChange} locale={locale} />
      ) : field.reference ? (
        <Autocomplete value={String(value ?? "")} options={options} isLoading={loading} placeholder={field.placeholder || `${locale === "en" ? "Select" : "Sélectionner"} ${field.label.toLowerCase()}`} searchPlaceholder={`${locale === "en" ? "Search" : "Rechercher"} ${field.label.toLowerCase()}`} emptyText={locale === "en" ? "No result" : "Aucun résultat"} onSelect={(option) => onChange(option.id)} showIdFallback={false} />
      ) : field.type === "multiselect" ? (
        <div className="grid gap-2 border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
          {(field.options ?? []).map((option) => {
            const checked = selectedValues.includes(option.value);
            return (
              <label key={option.value} className={`flex items-center gap-2 border bg-white px-3 py-2 text-xs font-black ${checked ? "border-blue-700 text-blue-800" : "border-slate-200 text-slate-700"}`}>
                <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked ? [...selectedValues, option.value] : selectedValues.filter((item) => item !== option.value))} />
                {option.label}
              </label>
            );
          })}
        </div>
      ) : field.type === "select" && field.allowCustom ? (
        <>
          <input list={datalistId} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} placeholder={locale === "en" ? "Select or create..." : "Sélectionner ou créer..."} className={base} />
          <datalist id={datalistId}>{(field.options ?? []).map((option) => <option key={option.value} value={option.value} />)}</datalist>
        </>
      ) : field.type === "select" ? (
        <select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className={base}>
          <option value="">-</option>
          {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : field.type === "json" ? (
        <RichTextEditor value={jsonValueToEditor(value)} onChange={onChange} minHeight="min-h-32" />
      ) : field.type === "textarea" ? (
        <textarea value={typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2)} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} className={`${base} h-28 text-sm`} />
      ) : field.type === "checkbox" ? (
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
      ) : (
        <input type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : field.name === "password" ? "password" : "text"} value={value ?? ""} onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)} placeholder={field.name === "password" ? (locale === "en" ? "Minimum 10 characters" : "Minimum 10 caractères") : field.placeholder} className={base} />
      )}
    </label>
  );
}

function jsonValueToEditor(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.content === "string") return value.content;
  return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char] ?? char));
}
