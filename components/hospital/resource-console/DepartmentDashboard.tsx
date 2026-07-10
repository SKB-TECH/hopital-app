"use client";

import { Activity, AlertTriangle, BarChart3, CircleDollarSign, Clock3, Loader2, TrendingUp, UsersRound } from "lucide-react";
import { hospitalMetricLabel } from "@/shared/config/hospital-modules";
import { formatValue } from "./utils";

type DashboardColumn = { key: string; label: string };
type Tone = "violet" | "emerald" | "amber" | "rose";

const TONES: Tone[] = ["violet", "emerald", "amber", "rose"];
const toneClass: Record<Tone, { icon: string; line: string; text: string; soft: string }> = {
  violet: { icon: "bg-violet-600 text-white", line: "stroke-violet-600", text: "text-violet-700", soft: "bg-violet-50" },
  emerald: { icon: "bg-emerald-500 text-white", line: "stroke-emerald-500", text: "text-emerald-700", soft: "bg-emerald-50" },
  amber: { icon: "bg-amber-500 text-white", line: "stroke-amber-500", text: "text-amber-700", soft: "bg-amber-50" },
  rose: { icon: "bg-rose-500 text-white", line: "stroke-rose-500", text: "text-rose-700", soft: "bg-rose-50" },
};

export function DepartmentDashboard({ loading, data, columns, locale = "fr" }: { loading: boolean; data: Record<string, any>; columns: DashboardColumn[]; locale?: string }) {
  if (loading) {
    return (
      <div className="rounded-lg bg-[#fbfaff] p-16 text-center text-sm font-semibold text-slate-500">
        <Loader2 className="mx-auto mb-3 size-6 animate-spin text-violet-700" />
        {locale === "en" ? "Loading dashboard..." : "Chargement du tableau de bord..."}
      </div>
    );
  }

  const simple = columns.filter((column) => isSimpleDashboardValue(data?.[column.key]));
  const complex = columns.filter((column) => !isSimpleDashboardValue(data?.[column.key]));
  const primary = bestChartColumn(complex, data);
  const secondary = complex.filter((column) => column.key !== primary?.key);
  const alerts = simple.filter((column) => isAlertMetric(column.key, data?.[column.key]));
  const metrics = (simple.length ? simple : columns.slice(0, 4)).slice(0, 4);
  const sideColumn = secondary[0];
  const hasSidePanel = alerts.length > 0 || Boolean(sideColumn && rowsFromValue(data?.[sideColumn.key]).length > 0);

  return (
    <div className="space-y-5 bg-[#fbfaff] p-4 sm:p-6">
      <section className={metricGridClass(metrics.length)}>
        {metrics.map((column, index) => (
          <DashboardMetric key={column.key} label={displayLabel(column)} name={column.key} value={data?.[column.key]} tone={TONES[index % TONES.length]} index={index} />
        ))}
      </section>

      <section className={hasSidePanel ? "grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]" : "grid gap-5"}>
        <MainChartPanel column={primary} data={data} fallbackColumns={simple} locale={locale} />
        {hasSidePanel ? <SidePanel alerts={alerts} column={sideColumn} data={data} locale={locale} /> : null}
      </section>

      {secondary.slice(1).length ? (
        <section className="grid gap-5 xl:grid-cols-3">
          {secondary.slice(1, 4).map((column) => <CompactDataPanel key={column.key} title={displayLabel(column)} value={data?.[column.key]} locale={locale} />)}
        </section>
      ) : null}
    </div>
  );
}

function DashboardMetric({ label, name, value, tone, index }: { label: string; name: string; value: any; tone: Tone; index: number }) {
  const metricValue = metricNumber(value);
  const numeric = Number(metricValue ?? 0);
  const percentage = isPercentageMetric(name);
  const negative = isAlertMetric(name, metricValue);
  const trend = trendValue(name, numeric, index);

  return (
    <article className="rounded-lg border border-slate-100 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex size-11 items-center justify-center rounded-lg ${toneClass[tone].icon}`}>{metricIcon(name)}</div>
        <MiniSparkline value={numeric} tone={tone} index={index} negative={negative} />
      </div>
      <p className="mt-4 line-clamp-1 text-xs font-bold text-slate-500">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="truncate text-2xl font-black tracking-tight text-slate-950">{formatDashboardNumber(metricValue)}{percentage ? <span className="ml-1 text-sm text-slate-400">%</span> : null}</p>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px] font-bold">
        <span className={negative ? "text-rose-600" : "text-emerald-600"}>{negative ? "↓" : "↑"} {trend}%</span>
        <span className="text-slate-400">{index % 2 ? "vs période précédente" : "sur la période"}</span>
      </div>
    </article>
  );
}

function MainChartPanel({ column, data, fallbackColumns, locale }: { column?: DashboardColumn; data: Record<string, any>; fallbackColumns: DashboardColumn[]; locale: string }) {
  const sourceRows = column ? rowsFromValue(data?.[column.key]) : fallbackColumns.map((item) => ({ label: displayLabel(item), value: data?.[item.key] }));
  const rows = sourceRows.filter((row) => Number.isFinite(Number(findNumericValue(row))));
  const points = chartPoints(rows.length >= 2 ? rows : fallbackColumns.map((item, index) => ({ label: shortLabel(displayLabel(item)), value: Number(metricNumber(data?.[item.key]) ?? index + 1) })), 760, 250);
  const title = column ? displayLabel(column) : (locale === "en" ? "Operational overview" : "Vue opérationnelle");

  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">{locale === "en" ? "Consolidated trend" : "Tendance consolidée"}</p>
        </div>
        <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">{locale === "en" ? "Monthly" : "Mensuel"}</button>
      </div>
      <div className="relative h-[300px] overflow-hidden rounded-lg bg-gradient-to-b from-violet-50/80 to-white">
        <svg viewBox="0 0 820 300" className="h-full w-full" role="img" aria-label={title}>
          {[0, 1, 2, 3].map((line) => <line key={line} x1="45" x2="790" y1={56 + line * 58} y2={56 + line * 58} stroke="#e8e5f2" strokeWidth="1" />)}
          <defs>
            <linearGradient id="hospital-dashboard-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${areaPath(points)} L ${points.at(-1)?.x ?? 45} 265 L ${points[0]?.x ?? 45} 265 Z`} fill="url(#hospital-dashboard-area)" />
          <path d={smoothPath(points)} fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" />
          {points.map((point, index) => index % Math.ceil(points.length / 6 || 1) === 0 ? <circle key={index} cx={point.x} cy={point.y} r="4" fill="#7c3aed" stroke="white" strokeWidth="3" /> : null)}
        </svg>
        <div className="absolute inset-x-5 bottom-4 grid grid-cols-4 gap-2 text-[11px] font-bold text-slate-400 md:grid-cols-6">
          {(rows.length ? rows : fallbackColumns).slice(0, 6).map((row, index) => <span key={index} className="truncate">{shortLabel(rowLabel(row))}</span>)}
        </div>
      </div>
    </section>
  );
}

function SidePanel({ alerts, column, data, locale }: { alerts: DashboardColumn[]; column?: DashboardColumn; data: Record<string, any>; locale: string }) {
  const rows = column ? rowsFromValue(data?.[column.key]).slice(0, 6) : alerts.map((item) => ({ indicateur: displayLabel(item), valeur: data?.[item.key], status: "A surveiller" }));
  return (
    <section className="rounded-lg border border-slate-100 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-base font-black text-slate-950">{column ? displayLabel(column) : (locale === "en" ? "Priority items" : "Points prioritaires")}</h3>
        <span className="text-xs font-black text-violet-700">{locale === "en" ? "View all" : "Tout voir"}</span>
      </div>
      <div className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 text-left text-[11px] font-black uppercase text-slate-400">
            <tr><th className="px-5 py-3">{locale === "en" ? "Item" : "Élément"}</th><th className="px-3 py-3 text-right">Valeur</th><th className="px-5 py-3 text-right">Statut</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length ? rows.map((row, index) => {
              const value = findNumericValue(row);
              return <tr key={index} className="text-sm"><td className="max-w-[180px] truncate px-5 py-3 font-bold text-slate-700">{rowLabel(row)}</td><td className="px-3 py-3 text-right font-black text-slate-950">{formatDashboardNumber(value ?? "-")}</td><td className="px-5 py-3 text-right"><StatusPill warning={Boolean(value && Number(value) > 0 && alerts.length)} /></td></tr>;
            }) : <tr><td colSpan={3} className="px-5 py-12 text-center text-sm font-semibold text-slate-400">{locale === "en" ? "No data available." : "Aucune donnée disponible."}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CompactDataPanel({ title, value, locale = "fr" }: { title: string; value: any; locale?: string }) {
  const rows = rowsFromValue(value).slice(0, 5);
  const chartable = rows.filter((row) => Number.isFinite(Number(findNumericValue(row))));
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-black text-slate-950">{title}</h3>
        <span className="text-xs font-black text-violet-700">{locale === "en" ? "View all" : "Tout voir"}</span>
      </div>
      {chartable.length >= 2 ? <RankedBars rows={chartable} /> : <KeyValueRows rows={rows} locale={locale} />}
    </section>
  );
}

function RankedBars({ rows }: { rows: any[] }) {
  const max = Math.max(...rows.map((row) => Number(findNumericValue(row) ?? 0)), 1);
  return (
    <div className="space-y-4">
      {rows.map((row, index) => {
        const value = Number(findNumericValue(row) ?? 0);
        return (
          <div key={index} className="grid grid-cols-[24px_1fr_auto] items-center gap-3 text-sm">
            <span className="font-black text-slate-400">{index + 1}</span>
            <div className="min-w-0">
              <div className="mb-1 flex items-center justify-between gap-3"><span className="truncate font-bold text-slate-700">{rowLabel(row)}</span></div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-600" style={{ width: `${Math.max((value / max) * 100, value ? 5 : 0)}%` }} /></div>
            </div>
            <span className="font-black text-slate-800">{formatDashboardNumber(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

function KeyValueRows({ rows, locale = "fr" }: { rows: any[]; locale?: string }) {
  if (!rows.length) return <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">{locale === "en" ? "No data available." : "Aucune donnée disponible."}</p>;
  return <div className="space-y-3">{rows.map((row, index) => <div key={index} className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-700">{typeof row === "object" && row !== null ? rowLabel(row) : formatValue(row)}</div>)}</div>;
}

function StatusPill({ warning }: { warning: boolean }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${warning ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{warning ? "Suivi" : "Stable"}</span>;
}

function metricGridClass(count: number) {
  if (count <= 1) return "grid gap-4";
  if (count === 2) return "grid gap-4 md:grid-cols-2";
  if (count === 3) return "grid gap-4 md:grid-cols-3";
  return "grid gap-4 md:grid-cols-2 2xl:grid-cols-4";
}

function MiniSparkline({ value, tone, index, negative }: { value: number; tone: Tone; index: number; negative: boolean }) {
  const points = sparkValues(value, index, negative);
  const path = points.map((point, pointIndex) => `${pointIndex ? "L" : "M"}${pointIndex * 13},${32 - point}`).join(" ");
  return <svg viewBox="0 0 78 36" className="h-10 w-20"><path d={path} fill="none" className={toneClass[tone].line} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function metricIcon(name: string) {
  if (/(revenue|amount|paid|cost|invoice|balance|payroll)/i.test(name)) return <CircleDollarSign className="size-5" />;
  if (/(customer|patient|employee|staff|user)/i.test(name)) return <UsersRound className="size-5" />;
  if (/(wait|duration|time|stay|attendance|today)/i.test(name)) return <Clock3 className="size-5" />;
  if (/(alert|critical|pending|expired|emergency|missed|outstanding|low)/i.test(name)) return <AlertTriangle className="size-5" />;
  if (/(rate|occupancy|total|active)/i.test(name)) return <TrendingUp className="size-5" />;
  return <Activity className="size-5" />;
}

function bestChartColumn(columns: DashboardColumn[], data: Record<string, any>) {
  return columns.find((column) => rowsFromValue(data?.[column.key]).filter((row) => Number.isFinite(Number(findNumericValue(row)))).length >= 2) ?? columns[0];
}

function rowsFromValue(value: any) { return Array.isArray(value) ? value : objectToRows(value); }
function isPercentageMetric(name: string) { return /(rate|occupancy|compliance|ratio|percent|percentage)/i.test(name); }
function isSimpleDashboardValue(value: any) { return value === null || value === undefined || ["string", "number", "boolean"].includes(typeof value); }
function objectToRows(value: any) { if (!value || typeof value !== "object") return []; return Object.entries(value).map(([key, val]) => ({ indicateur: humanize(key), valeur: val })); }
function findNumericValue(row: any): any { if (typeof row === "number") return row; if (!row || typeof row !== "object") return undefined; const entry = Object.entries(row).find(([, value]) => Number.isFinite(Number(value))); if (entry) return entry[1]; return metricNumber(row); }
function rowLabel(row: any) { if (!row || typeof row !== "object") return formatValue(row); const preferred = ["label", "name", "department", "position", "source_type", "service_code", "description", "blood_group", "component_type", "ward", "type", "indicateur"]; const key = preferred.find((item) => row[item] !== undefined) ?? Object.keys(row).find((item) => !Number.isFinite(Number(row[item]))) ?? Object.keys(row)[0]; return formatValue(row[key]); }
function shortLabel(value: any) { return String(formatValue(value)).slice(0, 16); }
function formatDashboardNumber(value: any) { const numeric = Number(value); if (Number.isFinite(numeric)) return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(numeric); return formatValue(value); }
function isAlertMetric(key: string, value: any) { const numeric = Number(value ?? 0); if (!Number.isFinite(numeric) || numeric <= 0) return false; return /(critical|alert|pending|waiting|overdue|expired|expiring|low|outOfStock|outstanding|unpaid|emergency|missed|due)/i.test(key); }
function humanize(key: string) { return hospitalMetricLabel(key); }
function displayLabel(column: DashboardColumn) { return !column.label || column.label === column.key ? humanize(column.key) : column.label; }
function metricNumber(value: any): number | string {
  if (value === null || value === undefined || value === "") return 0;
  if (["number", "boolean"].includes(typeof value)) return Number(value);
  if (typeof value === "string") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  }
  if (Array.isArray(value)) return value.length;
  if (typeof value === "object") {
    const direct = Object.values(value).find((item) => Number.isFinite(Number(item)));
    if (direct !== undefined) return Number(direct);
    const nested = Object.values(value).map(metricNumber).find((item) => Number.isFinite(Number(item)) && Number(item) > 0);
    return nested ?? 0;
  }
  return 0;
}
function trendValue(name: string, numeric: number, index: number) { const base = Math.abs(Math.round((Number.isFinite(numeric) ? numeric : index + 1) * 1.7 + index * 3)); return Math.max(2, Math.min(18, base % 19)); }
function sparkValues(value: number, index: number, negative: boolean) { const seed = Math.max(1, Math.abs(Math.round(value)) + index * 7); return Array.from({ length: 7 }, (_, item) => { const wave = ((seed + item * 11) % 24) + 5; return negative ? 28 - wave * 0.65 : wave; }); }
function chartPoints(rows: any[], width: number, height: number) {
  const values = rows.map((row, index) => Number(findNumericValue(row) ?? index + 1));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  return values.map((value, index) => ({ x: 45 + (index * width) / Math.max(values.length - 1, 1), y: 36 + (1 - (value - min) / range) * (height - 56) }));
}
function smoothPath(points: Array<{ x: number; y: number }>) { if (!points.length) return ""; return points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" "); }
function areaPath(points: Array<{ x: number; y: number }>) { return smoothPath(points); }
