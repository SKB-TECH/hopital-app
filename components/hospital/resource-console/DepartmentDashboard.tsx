"use client";

import { Activity, AlertCircle, Loader2 } from "lucide-react";
import { formatValue } from "./utils";

export function DepartmentDashboard({ loading, data, columns, locale = "fr" }: { loading: boolean; data: Record<string, any>; columns: { key: string; label: string }[]; locale?: string }) {
  if (loading) {
    return (
      <div className="p-16 text-center text-sm font-semibold text-slate-500">
        <Loader2 className="mx-auto mb-3 size-6 animate-spin text-blue-700" />
        {locale === "en" ? "Loading dashboard..." : "Chargement du tableau de bord..."}
      </div>
    );
  }

  const simple = columns.filter((column) => isSimpleDashboardValue(data?.[column.key]));
  const complex = columns.filter((column) => !isSimpleDashboardValue(data?.[column.key]));
  const alerts = simple.filter((column) => isAlertMetric(column.key, data?.[column.key]));

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {simple.map((column) => <DashboardMetric key={column.key} label={column.label || humanize(column.key)} name={column.key} value={data?.[column.key]} />)}
      </div>

      {alerts.length ? (
        <section className="border border-amber-300 bg-amber-50 p-5">
          <div className="mb-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-amber-700" />
            <div>
              <h3 className="font-black text-slate-950">{locale === "en" ? "Alerts to monitor" : "Alertes à surveiller"}</h3>
              <p className="text-sm font-semibold text-amber-800">{locale === "en" ? "Operational indicators requiring follow-up." : "Indicateurs opérationnels nécessitant un suivi."}</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {alerts.map((column) => (
              <div key={column.key} className="border border-amber-200 bg-white p-3">
                <p className="text-xs font-black uppercase text-amber-700">{humanize(column.key)}</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{formatValue(data?.[column.key])}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {complex.length ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {complex.map((column) => <DashboardDataPanel key={column.key} title={column.label || humanize(column.key)} value={data?.[column.key]} locale={locale} />)}
        </div>
      ) : null}

      <div className="border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-lg font-black text-slate-950">{locale === "en" ? "Operational reading" : "Lecture opérationnelle"}</h3>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          {locale === "en"
            ? "Cards show immediate KPIs. Charts and tables show breakdowns, rankings and alerts automatically calculated by the API."
            : "Les cartes affichent les KPI immédiats. Les graphiques et tableaux affichent les répartitions, classements et alertes calculés automatiquement par l’API."}
        </p>
      </div>
    </div>
  );
}

function DashboardMetric({ label, name, value }: { label: string; name: string; value: any }) {
  const numeric = Number(value ?? 0);
  const percentage = name.toLowerCase().includes("rate") || name.toLowerCase().includes("occupancy") || name.toLowerCase().includes("compliance");
  const danger = isAlertMetric(name, value);
  return (
    <div className={`border bg-white p-5 ${danger ? "border-amber-300" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className={`flex size-10 items-center justify-center text-white ${danger ? "bg-amber-600" : "bg-blue-700"}`}>
          <Activity className="size-5" />
        </div>
        {percentage && <span className="border border-slate-200 px-2 py-1 text-xs font-black text-slate-600">%</span>}
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{formatDashboardNumber(value)}</p>
      {Number.isFinite(numeric) && numeric > 0 ? <div className="mt-4 h-2 bg-slate-100"><div className={`${danger ? "bg-amber-600" : "bg-blue-700"} h-full`} style={{ width: `${percentage ? Math.min(numeric, 100) : Math.min(Math.max(numeric, 8), 100)}%` }} /></div> : <div className="mt-4 h-2 bg-slate-100" />}
    </div>
  );
}

function DashboardDataPanel({ title, value, locale = "fr" }: { title: string; value: any; locale?: string }) {
  const rows = Array.isArray(value) ? value : objectToRows(value);
  const chartable = rows.filter((row) => Number.isFinite(Number(findNumericValue(row))));
  return (
    <section className="border border-slate-200 bg-white p-5">
      <div className="mb-4 border-b border-slate-200 pb-3">
        <h3 className="font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{Array.isArray(value) ? `${rows.length} ${locale === "en" ? "item(s)" : "élément(s)"}` : locale === "en" ? "Consolidated data" : "Données consolidées"}</p>
      </div>
      {chartable.length >= 2 ? <MiniBarRows rows={chartable.slice(0, 8)} /> : <KeyValueRows rows={rows.slice(0, 8)} locale={locale} />}
    </section>
  );
}

function MiniBarRows({ rows }: { rows: any[] }) {
  const max = Math.max(...rows.map((row) => Number(findNumericValue(row) ?? 0)), 1);
  return <div className="space-y-3">{rows.map((row, index) => {
    const value = Number(findNumericValue(row) ?? 0);
    return <div key={index}>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm"><span className="truncate font-bold text-slate-700">{rowLabel(row)}</span><span className="font-black text-slate-950">{formatDashboardNumber(value)}</span></div>
      <div className="h-5 bg-slate-100"><div className="h-full bg-blue-700" style={{ width: `${Math.max((value / max) * 100, value ? 5 : 0)}%` }} /></div>
    </div>;
  })}</div>;
}

function KeyValueRows({ rows, locale = "fr" }: { rows: any[]; locale?: string }) {
  if (!rows.length) return <p className="bg-slate-50 p-4 text-sm font-semibold text-slate-500">{locale === "en" ? "No data available." : "Aucune donnée disponible."}</p>;
  return <div className="space-y-2">{rows.map((row, index) => <div key={index} className="border border-slate-100 bg-slate-50 p-3">
    {typeof row === "object" && row !== null ? Object.entries(row).slice(0, 4).map(([key, value]) => <div key={key} className="flex justify-between gap-4 text-sm"><span className="font-bold text-slate-500">{humanize(key)}</span><span className="truncate font-black text-slate-900">{formatValue(value)}</span></div>) : <p className="text-sm font-bold text-slate-700">{formatValue(row)}</p>}
  </div>)}</div>;
}

function isSimpleDashboardValue(value: any) { return value === null || value === undefined || ["string", "number", "boolean"].includes(typeof value); }
function objectToRows(value: any) { if (!value || typeof value !== "object") return []; return Object.entries(value).map(([key, val]) => ({ indicateur: humanize(key), valeur: val })); }
function findNumericValue(row: any) { if (typeof row === "number") return row; if (!row || typeof row !== "object") return undefined; const entry = Object.entries(row).find(([, value]) => Number.isFinite(Number(value))); return entry?.[1]; }
function rowLabel(row: any) { if (!row || typeof row !== "object") return formatValue(row); const preferred = ["label", "name", "department", "position", "source_type", "service_code", "description", "blood_group", "component_type", "ward", "type", "indicateur"]; const key = preferred.find((item) => row[item] !== undefined) ?? Object.keys(row).find((item) => !Number.isFinite(Number(row[item]))) ?? Object.keys(row)[0]; return formatValue(row[key]); }
function formatDashboardNumber(value: any) { const numeric = Number(value); if (Number.isFinite(numeric)) return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(numeric); return formatValue(value); }
function isAlertMetric(key: string, value: any) { const numeric = Number(value ?? 0); if (!Number.isFinite(numeric) || numeric <= 0) return false; return /(critical|alert|pending|waiting|overdue|expired|expiring|low|outOfStock|outstanding|unpaid|emergency|missed|due)/i.test(key); }
function humanize(key: string) { return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()); }
