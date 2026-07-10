"use client";

import { Activity, AlertTriangle, BarChart3, CircleDollarSign, Clock3, Loader2, TrendingUp } from "lucide-react";
import { formatValue } from "./utils";

type DashboardColumn = { key: string; label: string };

export function DepartmentDashboard({ loading, data, columns, locale = "fr" }: { loading: boolean; data: Record<string, any>; columns: DashboardColumn[]; locale?: string }) {
  if (loading) {
    return (
      <div className="p-16 text-center text-sm font-semibold text-slate-500">
        <Loader2 className="mx-auto mb-3 size-6 animate-spin text-cyan-700" />
        {locale === "en" ? "Loading dashboard..." : "Chargement du tableau de bord..."}
      </div>
    );
  }

  const simple = columns.filter((column) => isSimpleDashboardValue(data?.[column.key]));
  const complex = columns.filter((column) => !isSimpleDashboardValue(data?.[column.key]));
  const alerts = simple.filter((column) => isAlertMetric(column.key, data?.[column.key]));
  const totals = simple.map((column) => Number(data?.[column.key] ?? 0)).filter(Number.isFinite);
  const totalActivity = totals.reduce((sum, value) => sum + Math.max(value, 0), 0);

  return (
    <div className="space-y-5 bg-slate-50 p-4 sm:p-6">
      <section className="border border-slate-200 bg-white">
        <div className="grid gap-px bg-slate-200 md:grid-cols-3">
          <SummaryCell icon={<Activity className="size-4" />} label={locale === "en" ? "Tracked indicators" : "Indicateurs suivis"} value={simple.length} />
          <SummaryCell icon={<TrendingUp className="size-4" />} label={locale === "en" ? "Total activity" : "Activité totale"} value={totalActivity} />
          <SummaryCell icon={<AlertTriangle className="size-4" />} label={locale === "en" ? "Alerts" : "Alertes"} value={alerts.length} tone={alerts.length ? "warning" : "default"} />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {simple.map((column) => <DashboardMetric key={column.key} label={column.label || humanize(column.key)} name={column.key} value={data?.[column.key]} />)}
      </section>

      {alerts.length ? (
        <section className="border border-amber-200 bg-white">
          <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-black text-amber-950">
              <AlertTriangle className="size-4 text-amber-700" />
              {locale === "en" ? "Priority indicators" : "Indicateurs prioritaires"}
            </div>
            <span className="text-xs font-black text-amber-800">{alerts.length}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {alerts.map((column) => (
              <div key={column.key} className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3">
                <span className="text-sm font-semibold text-slate-700">{column.label || humanize(column.key)}</span>
                <span className="font-black text-slate-950">{formatDashboardNumber(data?.[column.key])}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {complex.length ? (
        <section className="grid gap-5 xl:grid-cols-2">
          {complex.map((column) => <DashboardDataPanel key={column.key} title={column.label || humanize(column.key)} value={data?.[column.key]} locale={locale} />)}
        </section>
      ) : null}
    </div>
  );
}

function SummaryCell({ icon, label, value, tone = "default" }: { icon: React.ReactNode; label: string; value: number; tone?: "default" | "warning" }) {
  return (
    <div className="bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-black uppercase text-slate-500">{label}</p>
        <span className={`flex size-8 items-center justify-center ${tone === "warning" ? "bg-amber-100 text-amber-800" : "bg-cyan-50 text-cyan-800"}`}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-black text-slate-950">{formatDashboardNumber(value)}</p>
    </div>
  );
}

function DashboardMetric({ label, name, value }: { label: string; name: string; value: any }) {
  const numeric = Number(value ?? 0);
  const percentage = isPercentageMetric(name);
  const alert = isAlertMetric(name, value);
  const icon = metricIcon(name);
  return (
    <article className={`border bg-white p-4 ${alert ? "border-amber-200" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`flex size-9 items-center justify-center ${alert ? "bg-amber-50 text-amber-800" : "bg-cyan-50 text-cyan-800"}`}>{icon}</div>
        {percentage ? <span className="border border-slate-200 px-2 py-1 text-[11px] font-black text-slate-500">%</span> : null}
      </div>
      <p className="mt-4 line-clamp-2 min-h-8 text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black leading-none text-slate-950">{formatDashboardNumber(value)}</p>
      <div className="mt-4 h-1.5 bg-slate-100">
        <div className={`h-full ${alert ? "bg-amber-600" : "bg-cyan-700"}`} style={{ width: `${metricWidth(numeric, percentage)}%` }} />
      </div>
    </article>
  );
}

function DashboardDataPanel({ title, value, locale = "fr" }: { title: string; value: any; locale?: string }) {
  const rows = Array.isArray(value) ? value : objectToRows(value);
  const chartable = rows.filter((row) => Number.isFinite(Number(findNumericValue(row))));
  return (
    <section className="border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="font-black text-slate-950">{title}</h3>
          <p className="mt-0.5 text-xs font-semibold uppercase text-slate-500">{Array.isArray(value) ? `${rows.length} ${locale === "en" ? "rows" : "lignes"}` : locale === "en" ? "Snapshot" : "Synthèse"}</p>
        </div>
        <BarChart3 className="size-5 text-slate-400" />
      </div>
      <div className="p-4">{chartable.length >= 2 ? <MiniBarRows rows={chartable.slice(0, 9)} /> : <KeyValueRows rows={rows.slice(0, 9)} locale={locale} />}</div>
    </section>
  );
}

function MiniBarRows({ rows }: { rows: any[] }) {
  const max = Math.max(...rows.map((row) => Number(findNumericValue(row) ?? 0)), 1);
  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const value = Number(findNumericValue(row) ?? 0);
        const width = Math.max((value / max) * 100, value ? 4 : 0);
        return (
          <div key={index} className="grid grid-cols-[minmax(96px,1fr)_minmax(120px,2fr)_auto] items-center gap-3 text-sm">
            <span className="truncate font-semibold text-slate-700">{rowLabel(row)}</span>
            <div className="h-2 bg-slate-100">
              <div className="h-full bg-cyan-700" style={{ width: `${width}%` }} />
            </div>
            <span className="min-w-12 text-right font-black text-slate-950">{formatDashboardNumber(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

function KeyValueRows({ rows, locale = "fr" }: { rows: any[]; locale?: string }) {
  if (!rows.length) return <p className="border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">{locale === "en" ? "No data available." : "Aucune donnée disponible."}</p>;
  return (
    <div className="overflow-hidden border border-slate-200">
      {rows.map((row, index) => (
        <div key={index} className="grid gap-3 border-b border-slate-100 bg-white p-3 last:border-b-0 md:grid-cols-2">
          {typeof row === "object" && row !== null ? Object.entries(row).slice(0, 4).map(([key, value]) => (
            <div key={key} className="min-w-0">
              <p className="text-[11px] font-black uppercase text-slate-400">{humanize(key)}</p>
              <p className="truncate text-sm font-black text-slate-900">{formatValue(value)}</p>
            </div>
          )) : <p className="text-sm font-bold text-slate-700">{formatValue(row)}</p>}
        </div>
      ))}
    </div>
  );
}

function metricIcon(name: string) {
  if (/(revenue|amount|paid|cost|invoice|balance|payroll)/i.test(name)) return <CircleDollarSign className="size-4" />;
  if (/(wait|duration|time|stay|attendance)/i.test(name)) return <Clock3 className="size-4" />;
  if (/(alert|critical|pending|expired|emergency|missed|outstanding|low)/i.test(name)) return <AlertTriangle className="size-4" />;
  return <Activity className="size-4" />;
}

function metricWidth(numeric: number, percentage: boolean) {
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  if (percentage) return Math.min(numeric, 100);
  return Math.min(Math.max(numeric, 10), 100);
}

function isPercentageMetric(name: string) { return /(rate|occupancy|compliance|ratio|percent|percentage)/i.test(name); }
function isSimpleDashboardValue(value: any) { return value === null || value === undefined || ["string", "number", "boolean"].includes(typeof value); }
function objectToRows(value: any) { if (!value || typeof value !== "object") return []; return Object.entries(value).map(([key, val]) => ({ indicateur: humanize(key), valeur: val })); }
function findNumericValue(row: any) { if (typeof row === "number") return row; if (!row || typeof row !== "object") return undefined; const entry = Object.entries(row).find(([, value]) => Number.isFinite(Number(value))); return entry?.[1]; }
function rowLabel(row: any) { if (!row || typeof row !== "object") return formatValue(row); const preferred = ["label", "name", "department", "position", "source_type", "service_code", "description", "blood_group", "component_type", "ward", "type", "indicateur"]; const key = preferred.find((item) => row[item] !== undefined) ?? Object.keys(row).find((item) => !Number.isFinite(Number(row[item]))) ?? Object.keys(row)[0]; return formatValue(row[key]); }
function formatDashboardNumber(value: any) { const numeric = Number(value); if (Number.isFinite(numeric)) return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(numeric); return formatValue(value); }
function isAlertMetric(key: string, value: any) { const numeric = Number(value ?? 0); if (!Number.isFinite(numeric) || numeric <= 0) return false; return /(critical|alert|pending|waiting|overdue|expired|expiring|low|outOfStock|outstanding|unpaid|emergency|missed|due)/i.test(key); }
function humanize(key: string) { return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()); }
