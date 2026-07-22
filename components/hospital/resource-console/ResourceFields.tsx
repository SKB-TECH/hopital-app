"use client";

import { useEffect, useState } from "react";
import { hospitalReferences } from "@/shared/config/hospital-modules";
import { api } from "@/shared/lib/http/api";
import Autocomplete, { type AutocompleteOption } from "@/components/ui/autocomplete";
import { normalizeRows, relationLabel } from "./utils";

export function TextField({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (value: any) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</span>
      <input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-700 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400 dark:focus:bg-slate-950" />
    </label>
  );
}

export function TextAreaField({ label, value, onChange }: { label: string; value: any; onChange: (value: any) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</span>
      <textarea value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="h-40 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-700 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400 dark:focus:bg-slate-950" />
    </label>
  );
}

export function SelectField({ label, value, onChange, options }: { label: string; value: any; onChange: (value: any) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</span>
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-700 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400 dark:focus:bg-slate-950">
        <option value="" disabled>Sélectionner</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export function ReferenceField({ referenceKey, label, value, onChange }: { referenceKey: string; label: string; value: any; onChange: (value: string) => void }) {
  const reference = hospitalReferences[referenceKey];
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reference) return;
    let mounted = true;
    setLoading(true);
    api.get(reference.endpoint)
      .then((response) => mounted && setOptions(normalizeRows(response.data).map((row) => ({ id: String(row[reference.valueKey ?? "id"] ?? row.id ?? ""), label: relationLabel(row, reference.labelKeys), description: relationLabel(row, reference.descriptionKeys ?? []) })).filter((option) => option.id)))
      .catch(() => mounted && setOptions([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [reference?.endpoint]);

  if (!reference) return <TextField label={label} value={value} onChange={onChange} />;

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-300">{label}</span>
      <Autocomplete value={String(value ?? "")} options={options} isLoading={loading} placeholder={"Sélectionner " + label.toLowerCase()} searchPlaceholder={"Rechercher " + label.toLowerCase()} emptyText="Aucun résultat" onSelect={(option) => onChange(option.id)} showIdFallback={false} />
    </label>
  );
}
