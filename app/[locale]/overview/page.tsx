"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Bed, CreditCard, Database, FileText, HeartPulse, Loader2, RefreshCcw, Stethoscope, TrendingUp, Users, WalletCards } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { api } from "@/shared/lib/http/api";

export default function OverviewPage() {
  const { isCollapsed } = useSidebar();
  const [data, setData] = useState<any>(null);
  const [health, setHealth] = useState("checking");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [report, ready] = await Promise.allSettled([api.get("/reports/dashboard"), api.get("/health/ready", { skipAuth: true } as any)]);
      if (report.status === "fulfilled") setData(report.value.data);
      setHealth(ready.status === "fulfilled" ? "online" : "offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const kpis = useMemo(() => [
    { label: "Patients", value: n(data?.overview?.patients), detail: `+${n(data?.patientFlow?.newPatientsToday)} aujourd’hui`, icon: Users, tone: "blue" },
    { label: "Admissions actives", value: n(data?.overview?.currentAdmissions), detail: `${n(data?.bedOccupancy?.occupancyRate)}% occupation lits`, icon: Bed, tone: "indigo" },
    { label: "Consultations ouvertes", value: n(data?.overview?.openConsultations), detail: `${n(data?.patientFlow?.consultationsToday)} aujourd’hui`, icon: Stethoscope, tone: "emerald" },
    { label: "Recettes du mois", value: money(data?.finance?.revenueThisMonth), detail: `${money(data?.finance?.revenueToday)} aujourd’hui`, icon: WalletCards, tone: "amber" },
    { label: "Factures impayées", value: n(data?.finance?.outstandingInvoices), detail: money(data?.finance?.outstandingAmount), icon: CreditCard, tone: "rose" },
    { label: "Employés actifs", value: n(data?.workforce?.activeEmployees), detail: `${n(data?.workforce?.attendanceRate)}% présence`, icon: Activity, tone: "slate" },
  ], [data]);

  const flowBars = [
    { label: "Arrivées", value: n(data?.patientFlow?.arrivalsToday) },
    { label: "Consultations", value: n(data?.patientFlow?.consultationsToday) },
    { label: "Admissions", value: n(data?.patientFlow?.admissionsToday) },
    { label: "Sorties", value: n(data?.patientFlow?.dischargesToday) },
    { label: "Urgences attente", value: n(data?.patientFlow?.emergencyWaiting) },
  ];

  const alertItems = [
    { label: "Résultats labo critiques", value: n(data?.alerts?.criticalLabResults), tone: "rose" },
    { label: "Articles stock bas", value: n(data?.alerts?.lowStockItems), tone: "amber" },
    { label: "Demandes sang urgence", value: n(data?.alerts?.emergencyBloodRequests), tone: "rose" },
    { label: "Factures impayées", value: n(data?.alerts?.unpaidInvoices), tone: "blue" },
    { label: "Congés en attente", value: n(data?.alerts?.pendingLeaveApprovals), tone: "slate" },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardSidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-[84px]" : "lg:ml-[340px]"}`}>
        <DashboardNavbar />
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 border border-slate-300 bg-white p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center bg-blue-700 text-white"><HeartPulse className="size-5" /></span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Hospital Command Center</p>
                    <h1 className="text-2xl font-black text-slate-950 lg:text-3xl">Tableau de bord hôpital</h1>
                  </div>
                </div>
                <p className="mt-3 max-w-4xl text-sm font-medium text-slate-600">Vue consolidée automatique : patients, soins, lits, diagnostics, pharmacie, banque de sang, facturation et ressources humaines.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill health={health} />
                <button onClick={load} className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"><RefreshCcw className="size-4" />Actualiser</button>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-6">
            {kpis.map((card) => <KpiCard key={card.label} {...card} loading={loading} />)}
          </div>

          <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
            <Panel title="Flux patient aujourd’hui" subtitle="Réception, consultations, admissions et urgences." icon={TrendingUp}>
              <BarChart data={flowBars} loading={loading} />
            </Panel>
            <Panel title="Alertes opérationnelles" subtitle="Points critiques à traiter par les responsables." icon={AlertTriangle}>
              <AlertList items={alertItems} loading={loading} />
            </Panel>
          </div>

          <div className="mb-6 grid gap-6 xl:grid-cols-3">
            <Panel title="Occupation hospitalisation" subtitle="Capacité lits et durée moyenne." icon={Bed}>
              <Gauge value={n(data?.bedOccupancy?.occupancyRate)} label="Occupation lits" loading={loading} />
              <div className="mt-5 grid grid-cols-3 border-t border-slate-200 pt-4 text-center">
                <SmallStat label="Total lits" value={n(data?.bedOccupancy?.totalBeds)} />
                <SmallStat label="Occupés" value={n(data?.bedOccupancy?.occupiedBeds)} />
                <SmallStat label="Disponibles" value={n(data?.bedOccupancy?.availableBeds)} />
              </div>
            </Panel>
            <Panel title="Finance" subtitle="Recettes, impayés et charges non facturées." icon={FileText}>
              <StackedFinance data={data?.finance} loading={loading} />
            </Panel>
            <Panel title="Diagnostics & stock" subtitle="Labo, imagerie et pharmacie." icon={Database}>
              <div className="space-y-3">
                <MiniProgress label="Labo en attente" value={n(data?.diagnostics?.labPending)} max={Math.max(n(data?.diagnostics?.labPending) + n(data?.diagnostics?.labCritical), 1)} loading={loading} />
                <MiniProgress label="Imagerie en attente" value={n(data?.diagnostics?.imagingPending)} max={Math.max(n(data?.diagnostics?.imagingPending), 1)} loading={loading} />
                <MiniProgress label="Stock bas" value={n(data?.pharmacyStock?.lowStock)} max={Math.max(n(data?.pharmacyStock?.lowStock) + n(data?.pharmacyStock?.outOfStock), 1)} loading={loading} />
                <MiniProgress label="Lots expirés" value={n(data?.pharmacyStock?.expiredBatches)} max={Math.max(n(data?.pharmacyStock?.expiredBatches) + n(data?.pharmacyStock?.expiringSoon), 1)} loading={loading} />
              </div>
            </Panel>
          </div>

          <div className="mb-6 grid gap-6 xl:grid-cols-2">
            <Panel title="Revenus par module" subtitle="Sources automatiques depuis les actes facturables." icon={WalletCards}>
              <HorizontalRanking rows={data?.revenueByModule ?? []} labelKey="source_type" valueKey="total" loading={loading} moneyValues />
            </Panel>
            <Panel title="Utilisation des prestations" subtitle="Actes les plus utilisés ce mois-ci." icon={Activity}>
              <HorizontalRanking rows={data?.serviceUtilization ?? []} labelKey="description" valueKey="acts" loading={loading} />
            </Panel>
          </div>

        </main>
      </div>
    </div>
  );
}

function StatusPill({ health }: { health: string }) {
  const online = health === "online";
  if (online) return null;
  return <span className="inline-flex h-11 items-center gap-2 border border-amber-300 bg-amber-50 px-4 text-sm font-black text-amber-700"><Activity className="size-4" />API indisponible</span>;
}

function KpiCard({ label, value, detail, icon: Icon, tone, loading }: any) {
  const colors: Record<string, string> = { blue: "bg-blue-700", indigo: "bg-indigo-700", emerald: "bg-emerald-700", amber: "bg-amber-600", rose: "bg-rose-700", slate: "bg-slate-800" };
  return <div className="border border-slate-300 bg-white p-4">
    <div className="flex items-start justify-between gap-4">
      <div className={`flex size-10 items-center justify-center text-white ${colors[tone] ?? colors.blue}`}><Icon className="size-5" /></div>
      {loading && <Loader2 className="size-4 animate-spin text-slate-400" />}
    </div>
    <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-black text-slate-950">{loading ? "..." : value}</p>
    <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
  </div>;
}

function Panel({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: any; children: React.ReactNode }) {
  return <section className="border border-slate-300 bg-white p-5">
    <div className="mb-5 flex items-start gap-3 border-b border-slate-200 pb-4">
      <span className="flex size-10 items-center justify-center bg-slate-900 text-white"><Icon className="size-5" /></span>
      <div><h2 className="text-lg font-black text-slate-950">{title}</h2><p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p></div>
    </div>
    {children}
  </section>;
}

function BarChart({ data, loading }: { data: { label: string; value: number }[]; loading: boolean }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  if (loading) return <SkeletonLines />;
  return <div className="space-y-4">{data.map((item) => <div key={item.label}>
    <div className="mb-1 flex items-center justify-between text-sm"><span className="font-bold text-slate-700">{item.label}</span><span className="font-black text-slate-950">{item.value}</span></div>
    <div className="h-8 border border-slate-200 bg-slate-50"><div className="h-full bg-blue-700" style={{ width: `${Math.max((item.value / max) * 100, item.value ? 6 : 0)}%` }} /></div>
  </div>)}</div>;
}

function AlertList({ items, loading }: { items: { label: string; value: number; tone: string }[]; loading: boolean }) {
  if (loading) return <SkeletonLines />;
  return <div className="space-y-3">{items.map((item) => <div key={item.label} className="flex items-center justify-between border border-slate-200 p-3">
    <div className="flex items-center gap-3"><span className={`size-3 ${item.value > 0 ? toneBg(item.tone) : "bg-emerald-500"}`} /><span className="text-sm font-bold text-slate-700">{item.label}</span></div>
    <span className="text-lg font-black text-slate-950">{item.value}</span>
  </div>)}</div>;
}

function Gauge({ value, label, loading }: { value: number; label: string; loading: boolean }) {
  const safe = Math.max(0, Math.min(value, 100));
  if (loading) return <div className="h-44 border border-slate-200 bg-slate-50" />;
  return <div className="flex items-center justify-center">
    <div className="relative size-44">
      <div className="absolute inset-0 rounded-full border-[18px] border-slate-100" />
      <div className="absolute inset-0 rounded-full border-[18px] border-blue-700" style={{ clipPath: `polygon(50% 50%, 50% 0, ${50 + safe / 2}% 0, 100% 0, 100% ${safe}%, 50% 50%)` }} />
      <div className="absolute inset-6 flex flex-col items-center justify-center bg-white text-center">
        <p className="text-4xl font-black text-slate-950">{safe}%</p>
        <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      </div>
    </div>
  </div>;
}

function SmallStat({ label, value }: { label: string; value: any }) {
  return <div><p className="text-xl font-black text-slate-950">{value}</p><p className="mt-1 text-[11px] font-black uppercase text-slate-500">{label}</p></div>;
}

function StackedFinance({ data, loading }: { data: any; loading: boolean }) {
  if (loading) return <SkeletonLines />;
  return <div className="space-y-4">
    <SmallMoney label="Recettes aujourd’hui" value={data?.revenueToday} />
    <SmallMoney label="Recettes ce mois" value={data?.revenueThisMonth} strong />
    <SmallMoney label="Impayés" value={data?.outstandingAmount} danger />
    <SmallMoney label="Charges non facturées" value={n(data?.chargesNotInvoiced)} />
  </div>;
}

function SmallMoney({ label, value, strong, danger }: { label: string; value: any; strong?: boolean; danger?: boolean }) {
  return <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0"><span className="text-sm font-bold text-slate-600">{label}</span><span className={`font-black ${strong ? "text-2xl" : "text-lg"} ${danger ? "text-rose-700" : "text-slate-950"}`}>{typeof value === "number" ? value : money(value)}</span></div>;
}

function MiniProgress({ label, value, max, loading }: { label: string; value: number; max: number; loading: boolean }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  if (loading) return <div className="h-12 bg-slate-100" />;
  return <div>
    <div className="mb-1 flex justify-between text-sm"><span className="font-bold text-slate-700">{label}</span><span className="font-black">{value}</span></div>
    <div className="h-3 bg-slate-100"><div className="h-full bg-slate-900" style={{ width: `${pct}%` }} /></div>
  </div>;
}

function HorizontalRanking({ rows, labelKey, valueKey, loading, moneyValues }: { rows: any[]; labelKey: string; valueKey: string; loading: boolean; moneyValues?: boolean }) {
  if (loading) return <SkeletonLines />;
  const list = rows.slice(0, 8);
  const max = Math.max(...list.map((row) => Number(row[valueKey] ?? 0)), 1);
  if (!list.length) return <p className="border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">Aucune donnée disponible.</p>;
  return <div className="space-y-3">{list.map((row, index) => {
    const value = Number(row[valueKey] ?? 0);
    return <div key={`${row[labelKey]}-${index}`}>
      <div className="mb-1 flex justify-between gap-4 text-sm"><span className="truncate font-bold text-slate-700">{formatLabel(row[labelKey])}</span><span className="font-black text-slate-950">{moneyValues ? money(value) : value}</span></div>
      <div className="h-5 bg-slate-100"><div className="h-full bg-blue-700" style={{ width: `${Math.max((value / max) * 100, 4)}%` }} /></div>
    </div>;
  })}</div>;
}

function SkeletonLines() { return <div className="space-y-3">{[1, 2, 3, 4].map((item) => <div key={item} className="h-9 animate-pulse bg-slate-100" />)}</div>; }
function n(value: any) { const number = Number(value ?? 0); return Number.isFinite(number) ? number : 0; }
function money(value: any) { const number = Number(value ?? 0); return Number.isFinite(number) ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(number) : "0"; }
function toneBg(tone: string) { return tone === "rose" ? "bg-rose-600" : tone === "amber" ? "bg-amber-500" : tone === "blue" ? "bg-blue-600" : "bg-slate-500"; }
function formatLabel(value: any) { return String(value ?? "-").replaceAll("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase()); }
