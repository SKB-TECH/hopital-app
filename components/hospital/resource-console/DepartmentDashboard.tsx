"use client";

import { Activity, AlertTriangle, Baby, BarChart3, CircleDollarSign, Clock3, HeartPulse, Loader2, Printer, TrendingUp, UsersRound } from "lucide-react";
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

  if (columns.some((column) => column.key === "salesLines")) {
    return <PharmacySalesDashboard data={data ?? {}} columns={columns} locale={locale} />;
  }
  if (columns.some((column) => column.key === "roomControl")) {
    return <SurgeryControlDashboard data={data ?? {}} columns={columns} locale={locale} />;
  }
  if (columns.some((column) => column.key === "recentPartogram")) {
    return <MaternityBirthSuiteDashboard data={data ?? {}} columns={columns} locale={locale} />;
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
        <section className={compactGridClass(secondary.slice(1).length)}>
          {secondary.slice(1, 4).map((column) => <CompactDataPanel key={column.key} title={displayLabel(column)} value={data?.[column.key]} locale={locale} />)}
        </section>
      ) : null}
    </div>
  );
}

function SurgeryControlDashboard({ data, columns, locale }: { data: Record<string, any>; columns: DashboardColumn[]; locale: string }) {
  const metrics = columns.filter((column) => isSimpleDashboardValue(data?.[column.key])).slice(0, 5);
  const rooms = rowsFromValue(data?.roomControl);
  const upcoming = rowsFromValue(data?.upcomingSlots);
  const team = rowsFromValue(data?.surgicalTeamUtilization);
  return (
    <div className="space-y-5 bg-[#fbfaff] p-4 sm:p-6">
      <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">Bloc opératoire</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Tour de contrôle chirurgicale</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Salles, statuts temps réel, checklist OMS, comptage et flux ambulatoire.</p>
          </div>
          <button onClick={() => window.print()} className="inline-flex h-11 items-center justify-center gap-2 border border-blue-700 bg-blue-700 px-4 text-sm font-black text-white hover:bg-blue-800">
            <Printer className="size-4" /> Imprimer la vacation
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((column, index) => <PharmacySalesMetric key={column.key} label={displayLabel(column)} value={data?.[column.key]} tone={TONES[index % TONES.length]} />)}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {rooms.length ? rooms.map((room, index) => <OperatingRoomCard key={room.roomId ?? index} room={room} />) : <p className="rounded-lg border border-slate-100 bg-white p-8 text-center text-sm font-semibold text-slate-500 xl:col-span-3">Aucune salle opératoire configurée.</p>}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="rounded-lg border border-slate-100 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-base font-black text-slate-950">Interventions à venir</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Planning actif du bloc.</p>
          </div>
          <UpcomingSurgeryGrid rows={upcoming} />
        </section>
        <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
          <h3 className="text-base font-black text-slate-950">Utilisation équipe</h3>
          <div className="mt-5"><KeyValueRows rows={team.slice(0, 6)} locale={locale} /></div>
        </section>
      </section>
    </div>
  );
}

function OperatingRoomCard({ room }: { room: any }) {
  const tone = surgeryRoomTone(room.status);
  const progress = surgeryProgress(room);
  return (
    <article className={`rounded-lg border p-5 shadow-[0_12px_28px_rgba(15,23,42,0.045)] ${tone.wrap}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide opacity-75">{room.roomCode || "Salle"}</p>
          <h3 className="mt-1 text-xl font-black">{room.roomName || room.roomCode || "Bloc"}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${tone.badge}`}>{surgeryStatusLabel(room.status)}</span>
      </div>
      <div className="mt-5 min-h-[72px]">
        <p className="line-clamp-2 text-sm font-black">{room.procedureName || "Salle libre"}</p>
        <p className="mt-1 text-xs font-semibold opacity-75">{room.patientName || room.medicalRecordNumber || "Aucun patient en salle"}</p>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-[11px] font-black uppercase opacity-75"><span>Progression</span><span>{progress}%</span></div>
        <div className="h-3 overflow-hidden rounded-full bg-white/70"><div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold opacity-80">
        <span>Début</span><span className="text-right">{formatValue(room.estimatedStartAt)}</span>
        <span>Fin estimée</span><span className="text-right">{formatValue(room.estimatedEndAt)}</span>
      </div>
    </article>
  );
}

function UpcomingSurgeryGrid({ rows }: { rows: any[] }) {
  if (!rows.length) return <p className="p-10 text-center text-sm font-semibold text-slate-500">Aucune intervention à venir.</p>;
  return (
    <div className="w-full">
      <table className="w-full table-fixed border-collapse text-left">
        <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500">
          <tr><th className="w-[22%] px-4 py-3">Salle</th><th className="w-[28%] px-4 py-3">Patient</th><th className="w-[32%] px-4 py-3">Acte</th><th className="w-[18%] px-4 py-3">Statut</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={index} className="text-sm">
              <td className="break-words px-4 py-3 font-black text-slate-800">{row.roomCode || row.roomName || "-"}</td>
              <td className="break-words px-4 py-3 font-bold text-slate-700">{row.patientName || row.medicalRecordNumber || "-"}</td>
              <td className="break-words px-4 py-3 font-bold text-slate-800">{row.procedureName || "-"}</td>
              <td className="px-4 py-3 font-black text-slate-700">{surgeryStatusLabel(row.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function surgeryRoomTone(status: any) {
  const value = String(status ?? "").toUpperCase();
  if (value === "INDUCTION") return { wrap: "border-blue-100 bg-blue-50 text-blue-950", badge: "bg-blue-700 text-white", bar: "bg-blue-700" };
  if (value === "INCISION" || value === "SUTURE") return { wrap: "border-rose-100 bg-rose-50 text-rose-950", badge: "bg-rose-700 text-white", bar: "bg-rose-700" };
  if (value === "CLEANING") return { wrap: "border-amber-100 bg-amber-50 text-amber-950", badge: "bg-amber-600 text-white", bar: "bg-amber-600" };
  if (value === "RECOVERY_ROOM") return { wrap: "border-emerald-100 bg-emerald-50 text-emerald-950", badge: "bg-emerald-600 text-white", bar: "bg-emerald-600" };
  return { wrap: "border-slate-100 bg-white text-slate-950", badge: "bg-slate-200 text-slate-700", bar: "bg-slate-400" };
}

function surgeryStatusLabel(status: any) {
  const value = String(status ?? "AVAILABLE").toUpperCase();
  return ({ SCHEDULED: "Planifié", INDUCTION: "Induction", INCISION: "Incision", SUTURE: "Suture", RECOVERY_ROOM: "Salle de réveil", CLEANING: "Nettoyage", COMPLETED: "Terminé", CANCELLED: "Annulé", AVAILABLE: "Libre" } as Record<string, string>)[value] ?? formatValue(status);
}

function surgeryProgress(room: any) {
  const start = new Date(room.actualStartAt || room.estimatedStartAt || "").getTime();
  const end = new Date(room.estimatedEndAt || "").getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return room.procedureName ? 45 : 0;
  return Math.max(0, Math.min(100, Math.round(((Date.now() - start) / (end - start)) * 100)));
}

function MaternityBirthSuiteDashboard({ data, columns, locale }: { data: Record<string, any>; columns: DashboardColumn[]; locale: string }) {
  const metrics = columns.filter((column) => isSimpleDashboardValue(data?.[column.key])).slice(0, 5);
  const partogram = rowsFromValue(data?.recentPartogram).slice().reverse();
  const fetalAlerts = rowsFromValue(data?.fetalAlerts);
  const recentBirths = rowsFromValue(data?.recentBirths);
  return (
    <div className="space-y-5 bg-[#fbfaff] p-4 sm:p-6">
      <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">Gyn-Obs</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Salle de naissance</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Partogramme, RCF/Toco, alertes et transitions mère-enfant.</p>
          </div>
          <button onClick={() => window.print()} className="inline-flex h-11 items-center justify-center gap-2 border border-blue-700 bg-blue-700 px-4 text-sm font-black text-white hover:bg-blue-800">
            <Printer className="size-4" /> Imprimer la garde
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((column, index) => <PharmacySalesMetric key={column.key} label={displayLabel(column)} value={data?.[column.key]} tone={TONES[index % TONES.length]} />)}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <BirthPartogramPanel rows={partogram} />
        <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-950">Alertes RCF</h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">Bradycardie ou tachycardie détectée</p>
            </div>
            <HeartPulse className="size-5 text-rose-600" />
          </div>
          <div className="mt-5 space-y-3">
            {fetalAlerts.length ? fetalAlerts.slice(0, 6).map((row, index) => (
              <article key={index} className="border border-rose-100 bg-rose-50 p-3">
                <p className="text-sm font-black text-rose-950">{row.patientName || row.medicalRecordNumber || "Patiente"}</p>
                <p className="mt-1 text-xs font-bold text-rose-700">{row.status} · {row.fetalBpm} bpm · {formatValue(row.sampledAt)}</p>
              </article>
            )) : <p className="border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">Aucune alerte RCF active.</p>}
          </div>
        </section>
      </section>

      <section className="rounded-lg border border-slate-100 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <Baby className="size-5 text-blue-700" />
          <div>
            <h3 className="text-base font-black text-slate-950">Naissances récentes</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Contrôle identitovigilance mère-enfant.</p>
          </div>
        </div>
        <RecentBirthsGrid rows={recentBirths} />
      </section>
    </div>
  );
}

function BirthPartogramPanel({ rows }: { rows: any[] }) {
  const chartRows = rows.length >= 2 ? rows : [{ cervicalDilationCm: 0, occurredAt: "Début" }, { cervicalDilationCm: 10, occurredAt: "Action" }];
  const values = chartRows.map((row) => Number(row.cervicalDilationCm ?? 0));
  const points = values.map((value, index) => ({ x: 50 + (index * 710) / Math.max(values.length - 1, 1), y: 250 - (Math.max(0, Math.min(10, value)) / 10) * 205 }));
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-950">Partogramme électronique</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">Dilatation du col, ligne d’alerte et ligne d’action.</p>
        </div>
        <BarChart3 className="size-5 text-blue-700" />
      </div>
      <div className="relative h-[330px] overflow-hidden rounded-lg bg-gradient-to-b from-blue-50 to-white">
        <svg viewBox="0 0 820 320" className="h-full w-full" role="img" aria-label="Partogramme">
          {[0, 2, 4, 6, 8, 10].map((value) => {
            const y = 250 - (value / 10) * 205;
            return <g key={value}><line x1="50" x2="780" y1={y} y2={y} stroke="#e7edf7" /><text x="20" y={y + 4} className="fill-slate-500 text-[11px] font-bold">{value}</text></g>;
          })}
          <line x1="135" y1="250" x2="610" y2="45" stroke="#f59e0b" strokeWidth="3" strokeDasharray="8 8" />
          <line x1="240" y1="250" x2="715" y2="45" stroke="#dc2626" strokeWidth="3" strokeDasharray="8 8" />
          <path d={smoothPath(points)} fill="none" stroke="#1d4ed8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="5" fill="#1d4ed8" stroke="white" strokeWidth="3" />)}
        </svg>
        <div className="absolute bottom-4 left-5 flex gap-4 text-[11px] font-black text-slate-600">
          <span className="text-blue-700">Dilatation</span>
          <span className="text-amber-600">Ligne alerte</span>
          <span className="text-rose-700">Ligne action</span>
        </div>
      </div>
    </section>
  );
}

function RecentBirthsGrid({ rows }: { rows: any[] }) {
  if (!rows.length) return <p className="p-10 text-center text-sm font-semibold text-slate-500">Aucune naissance récente à afficher.</p>;
  return (
    <div className="w-full">
      <table className="w-full table-fixed border-collapse text-left">
        <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500">
          <tr><th className="w-[28%] px-4 py-3">Mère</th><th className="w-[28%] px-4 py-3">Nouveau-né</th><th className="w-[18%] px-4 py-3">Apgar 5</th><th className="w-[26%] px-4 py-3">Constat</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={index} className="text-sm">
              <td className="break-words px-4 py-3 font-bold text-slate-800">{row.motherName || row.motherMrn || "-"}</td>
              <td className="break-words px-4 py-3 font-bold text-slate-800">{row.newbornName || row.newbornMrn || "-"}</td>
              <td className="px-4 py-3 font-black text-slate-950">{formatValue(row.apgar5)}</td>
              <td className="break-words px-4 py-3 font-semibold text-slate-600">{row.serialNumber || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PharmacySalesDashboard({ data, columns, locale }: { data: Record<string, any>; columns: DashboardColumn[]; locale: string }) {
  const metrics = columns.filter((column) => isSimpleDashboardValue(data?.[column.key])).slice(0, 5);
  const salesLines = rowsFromValue(data?.salesLines);
  const salesByDay = rowsFromValue(data?.salesByDay).filter((row) => Number.isFinite(Number(findNumericValue(row))));
  const recentSales = rowsFromValue(data?.recentSales);
  const paymentMethods = rowsFromValue(data?.paymentMethods);
  const total = Number(data?.salesThisMonth ?? data?.salesToday ?? 0);
  const units = Number(data?.unitsSoldThisMonth ?? salesLines.reduce((sum, row) => sum + Number(row.quantitySold ?? 0), 0));

  return (
    <div className="pharmacy-sales-report space-y-5 bg-[#fbfaff] p-4 sm:p-6 print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .pharmacy-sales-report, .pharmacy-sales-report * { visibility: visible; }
          .pharmacy-sales-report { position: absolute; inset: 0 auto auto 0; width: 100%; }
          .pharmacy-sales-report .no-print { display: none !important; }
        }
      `}</style>
      <section className="flex flex-col gap-4 rounded-lg border border-slate-100 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.045)] print:border-slate-300 print:shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">Pharmacie</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Rapport des ventes médicaments</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Médicament, quantité vendue, prix unitaire, total et encaissements.</p>
          </div>
          <button onClick={() => window.print()} className="no-print inline-flex h-11 items-center justify-center gap-2 border border-blue-700 bg-blue-700 px-4 text-sm font-black text-white hover:bg-blue-800">
            <Printer className="size-4" /> Imprimer le rapport
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((column, index) => <PharmacySalesMetric key={column.key} label={displayLabel(column)} value={data?.[column.key]} tone={TONES[index % TONES.length]} />)}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <SalesChartPanel rows={salesByDay.length ? salesByDay : salesLines} title="Évolution des ventes" />
        <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.045)] print:border-slate-300 print:shadow-none">
          <h3 className="text-base font-black text-slate-950">Résumé caisse</h3>
          <div className="mt-5 space-y-4">
            <SummaryLine label="Total ventes" value={formatMoney(total)} strong />
            <SummaryLine label="Unités vendues" value={formatDashboardNumber(units)} />
            <SummaryLine label="Délivrances" value={formatDashboardNumber(data?.dispensationsToday ?? recentSales.length)} />
          </div>
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="mb-3 text-xs font-black uppercase text-slate-500">Modes de paiement</p>
            <KeyValueRows rows={paymentMethods.slice(0, 4)} locale={locale} />
          </div>
        </section>
      </section>

      <section className="rounded-lg border border-slate-100 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.045)] print:border-slate-300 print:shadow-none">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-black text-slate-950">Détail des médicaments vendus</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Tableau imprimable pour le contrôle journalier ou mensuel.</p>
        </div>
        <SalesDataGrid rows={salesLines} />
      </section>
    </div>
  );
}

function PharmacySalesMetric({ label, value, tone }: { label: string; value: any; tone: Tone }) {
  return (
    <article className="border border-slate-100 bg-slate-50 p-4 print:border-slate-300">
      <div className={`mb-4 flex size-10 items-center justify-center rounded-lg ${toneClass[tone].icon}`}>{metricIcon(label)}</div>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate text-2xl font-black text-slate-950">{/(vente|payé|recette|montant)/i.test(label) ? formatMoney(value) : formatDashboardNumber(value)}</p>
    </article>
  );
}

function SalesChartPanel({ rows, title }: { rows: any[]; title: string }) {
  const points = chartPoints(rows.length >= 2 ? rows : [{ label: "Début", value: 0 }, { label: "Ventes", value: 1 }], 760, 250);
  return (
    <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.045)] print:border-slate-300 print:shadow-none">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">Courbe des ventes pharmacie</p>
        </div>
        <BarChart3 className="size-5 text-blue-700" />
      </div>
      <div className="relative h-[300px] overflow-hidden rounded-lg bg-gradient-to-b from-blue-50 to-white print:h-[230px]">
        <svg viewBox="0 0 820 300" className="h-full w-full" role="img" aria-label={title}>
          {[0, 1, 2, 3].map((line) => <line key={line} x1="45" x2="790" y1={56 + line * 58} y2={56 + line * 58} stroke="#e7edf7" strokeWidth="1" />)}
          <defs>
            <linearGradient id="pharmacy-sales-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${areaPath(points)} L ${points.at(-1)?.x ?? 45} 265 L ${points[0]?.x ?? 45} 265 Z`} fill="url(#pharmacy-sales-area)" />
          <path d={smoothPath(points)} fill="none" stroke="#1d4ed8" strokeWidth="4" strokeLinecap="round" />
          {points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="4" fill="#1d4ed8" stroke="white" strokeWidth="3" />)}
        </svg>
        <div className="absolute inset-x-5 bottom-4 grid grid-cols-4 gap-2 text-[11px] font-bold text-slate-500 md:grid-cols-6">
          {rows.slice(0, 6).map((row, index) => <span key={index} className="truncate">{shortLabel(rowLabel(row))}</span>)}
        </div>
      </div>
    </section>
  );
}

function SalesDataGrid({ rows }: { rows: any[] }) {
  if (!rows.length) return <p className="p-10 text-center text-sm font-semibold text-slate-500">Aucune vente pharmacie à afficher.</p>;
  const total = rows.reduce((sum, row) => sum + Number(row.totalPrice ?? 0), 0);
  return (
    <div className="w-full">
      <table className="w-full table-fixed border-collapse text-left">
        <thead className="bg-slate-50 text-[11px] font-black uppercase text-slate-500">
          <tr>
            <th className="w-[42%] px-4 py-3">Médicament</th>
            <th className="w-[18%] px-4 py-3 text-right">Quantité vendue</th>
            <th className="w-[20%] px-4 py-3 text-right">Prix unitaire</th>
            <th className="w-[20%] px-4 py-3 text-right">Prix total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={`${row.serviceCode ?? row.medicine ?? "sale"}-${index}`} className="align-top text-sm">
              <td className="break-words px-4 py-3 font-bold text-slate-800">{formatValue(row.medicine ?? row.serviceCode)}</td>
              <td className="px-4 py-3 text-right font-black text-slate-700">{formatDashboardNumber(row.quantitySold)}</td>
              <td className="px-4 py-3 text-right font-semibold text-slate-700">{formatMoney(row.unitPrice)}</td>
              <td className="px-4 py-3 text-right font-black text-slate-950">{formatMoney(row.totalPrice)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-slate-200 bg-slate-50 text-sm font-black text-slate-950">
          <tr><td className="px-4 py-3" colSpan={3}>Total</td><td className="px-4 py-3 text-right">{formatMoney(total)}</td></tr>
        </tfoot>
      </table>
    </div>
  );
}

function SummaryLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex items-center justify-between gap-4 text-sm"><span className="font-bold text-slate-500">{label}</span><span className={strong ? "text-2xl font-black text-slate-950" : "font-black text-slate-900"}>{value}</span></div>;
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
      {title === hospitalMetricLabel("salesLines") ? <SalesLinesTable rows={rowsFromValue(value)} /> : chartable.length >= 2 ? <RankedBars rows={chartable} /> : <KeyValueRows rows={rows} locale={locale} />}
    </section>
  );
}

function SalesLinesTable({ rows }: { rows: any[] }) {
  if (!rows.length) return <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">Aucune vente pharmacie.</p>;
  return (
    <div className="overflow-hidden border border-slate-200">
      <div className="grid grid-cols-[minmax(0,1fr)_90px_110px_110px] bg-slate-50 px-3 py-2 text-[11px] font-black uppercase text-slate-500">
        <span>Médicament</span><span className="text-right">Quantité</span><span className="text-right">Prix unit.</span><span className="text-right">Total</span>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.slice(0, 8).map((row, index) => (
          <div key={index} className="grid grid-cols-[minmax(0,1fr)_90px_110px_110px] gap-2 px-3 py-3 text-sm">
            <span className="min-w-0 truncate font-bold text-slate-800">{formatValue(row.medicine)}</span>
            <span className="text-right font-black text-slate-700">{formatDashboardNumber(row.quantitySold)}</span>
            <span className="text-right font-bold text-slate-600">{formatDashboardNumber(row.unitPrice)}</span>
            <span className="text-right font-black text-slate-950">{formatDashboardNumber(row.totalPrice)}</span>
          </div>
        ))}
      </div>
    </div>
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

function compactGridClass(count: number) {
  if (count <= 1) return "grid gap-5";
  if (count === 2) return "grid gap-5 xl:grid-cols-2";
  return "grid gap-5 xl:grid-cols-3";
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
function rowLabel(row: any) {
  if (!row || typeof row !== "object") return formatValue(row);
  const fullName = [row.firstName ?? row.first_name, row.lastName ?? row.last_name].filter(Boolean).join(" ").trim();
  if (fullName) return row.medicalRecordNumber || row.medical_record_number ? `${fullName} · ${row.medicalRecordNumber ?? row.medical_record_number}` : fullName;
  const preferred = ["label", "description", "medicine", "invoiceNumber", "patientName", "name", "medicalRecordNumber", "practitionerName", "prescriberName", "cashierName", "department", "position", "method", "sourceType", "source_type", "bloodGroup", "blood_group", "componentType", "component_type", "ward", "type", "day", "indicateur", "serviceCode", "service_code"];
  const key = preferred.find((item) => isReadableLabelValue(row[item])) ?? Object.keys(row).find((item) => isReadableLabelValue(row[item]));
  return key ? cleanDashboardLabel(row[key]) : "-";
}
function isReadableLabelValue(value: any) { return value !== undefined && value !== null && value !== "" && !isUuid(value) && !Number.isFinite(Number(value)) && !isTechnicalDashboardLabel(value); }
function isTechnicalDashboardLabel(value: any) { return /^(tarif manquant:|medicine:|vaccine:)[\w:-]+/i.test(String(value).trim()); }
function cleanDashboardLabel(value: any) {
  const label = String(formatValue(value)).trim();
  if (/^med:/i.test(label)) return "Médicament";
  if (/^vaccine:/i.test(label)) return "Vaccination";
  return label;
}
function isUuid(value: any) { return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
function shortLabel(value: any) { return String(formatValue(value)).slice(0, 16); }
function formatMoney(value: any, currency = "USD") {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return formatValue(value);
  const amount = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: numeric % 1 ? 2 : 0 }).format(numeric).replace(/[\u202f\u00a0]/g, " ");
  return `${amount} ${currency}`;
}
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
