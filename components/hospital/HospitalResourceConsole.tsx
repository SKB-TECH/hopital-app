"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Activity, AlertCircle, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, CreditCard, Database, Download, Edit3, Eye, FileJson, FileText, Loader2, Mail, Plus, Printer, Receipt, RefreshCcw, Search, Send, Stethoscope, UserRound, X } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { findHospitalModule, hospitalReferences } from "@/shared/config/hospital-modules";
import type { HospitalField, HospitalResource } from "@/shared/types/hospital.types";
import { api } from "@/shared/lib/http/api";
import Autocomplete, { type AutocompleteOption } from "@/components/ui/autocomplete";
import { printService, type PrintTemplate } from "@/shared/services/print.service";
import { useMe } from "@/shared/hooks/auth.hooks";
import { canAccessHospitalModule, getFirstAccessibleHospitalModule } from "@/shared/lib/auth/module-access";
import RichTextEditor from "@/components/forms/RichTextEditor";

export default function HospitalResourceConsole() {
  const params = useParams<{ locale: string; module?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const locale = params.locale || "fr";
  const module = findHospitalModule(params.module);
  const { data: user, isLoading: userLoading } = useMe();
  const selectedKey = searchParams.get("resource") || module.resources[0]?.key;
  const selected = module.resources.find((item) => item.key === selectedKey) || module.resources[0];
  const canAccessModule = canAccessHospitalModule(user, module.key);

  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Record<string, any>>({});
  const [rawJson, setRawJson] = useState("{}");
  const [mode, setMode] = useState<"form" | "json">("form");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [operation, setOperation] = useState<OperationState | null>(null);
  const [operationForm, setOperationForm] = useState<Record<string, any>>({});
  const [printDialog, setPrintDialog] = useState<{ row?: any } | null>(null);

  const load = async () => {
    if (!selected) return;
    if (userLoading || !user || !canAccessModule) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.get(selected.endpoint, { params: selected.endpoint === "/appointments" ? { limit: 100 } : undefined });
      setRows(normalizeRows(response.data));
    } catch (err: any) {
      setRows([]);
      setError(readError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm(defaultForm(selected?.fields ?? []));
    setRawJson("{}");
    load();
  }, [selected?.endpoint, userLoading, user?.id, canAccessModule]);

  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(term));
  }, [query, rows]);

  const openCreate = () => {
    setEditingRow(null);
    setForm(defaultForm(selected?.fields ?? []));
    setRawJson("{}");
    setMode("form");
    setFormOpen(true);
  };

  const openEdit = (row: any) => {
    setEditingRow(row);
    setForm(defaultForm(selected?.fields ?? [], row));
    setRawJson(JSON.stringify(row ?? {}, null, 2));
    setMode("form");
    setFormOpen(true);
  };

  const submit = async () => {
    if (!selected || selected.canCreate === false) return;
    setPosting(true);
    setError("");
    try {
      const effectiveFields = editingRow?.id && selected.endpoint === "/users" ? selected.fields.filter((field) => field.name !== "password") : selected.fields;
      const payload = mode === "json" ? parseJsonPayload(rawJson) : cleanPayload(form, effectiveFields);
      if (editingRow?.id && selected.endpoint === "/users") {
        delete payload.password;
      }
      if (editingRow?.id && selected.canUpdate !== false) {
        await api.patch(`${selected.endpoint}/${editingRow.id}`, payload);
      } else {
        await api.post(selected.endpoint, payload);
      }
      setForm(defaultForm(selected.fields));
      setRawJson("{}");
      setFormOpen(false);
      setEditingRow(null);
      await load();
    } catch (err: any) {
      setError(readError(err));
    } finally {
      setPosting(false);
    }
  };

  const switchResource = (resource: HospitalResource) => {
    router.push(`/${locale}/hospital/${module.key}?resource=${resource.key}`);
  };

  const openOperation = (kind: OperationKind, row?: any) => {
    setOperation({ kind, row, endpoint: selected.endpoint });
    setOperationForm(defaultOperationForm(kind, row, selected.endpoint));
  };

  const submitOperation = async () => {
    if (!operation) return;
    setPosting(true);
    setError("");
    try {
      validateOperation(operation.kind, operationForm);
      if (operation.kind === "generate-invoice") {
        await api.post("/billing/invoices", cleanObject(operationForm));
      }
      if (operation.kind === "preview-invoice") {
        const response = await api.post("/billing/invoices/preview", cleanObject(operationForm));
        setOperationForm((current) => ({ ...current, preview: response.data }));
        setPosting(false);
        return;
      }
      if (operation.kind === "pay-invoice" && operation.row?.id) {
        await api.post(`/billing/invoices/${operation.row.id}/payments`, cleanObject(operationForm));
      }
      if (operation.kind === "validate-lab" && operation.row?.id) {
        await api.patch(`/laboratory/results/${operation.row.id}/validate`, {});
      }
      if (operation.kind === "discharge" && operation.row?.id) {
        await api.patch(`/admissions/${operation.row.id}/discharge`, cleanObject(operationForm));
      }
      if (operation.kind === "complete-consultation" && operation.row?.id) {
        await api.patch(`/consultations/${operation.row.id}/complete`, cleanObject(operationForm));
      }
      if (operation.kind === "stock-movement") {
        await api.post("/inventory/items/movements", cleanObject(operationForm));
      }
      if (operation.kind === "change-status" && operation.row?.id && operation.endpoint) {
        const payload: Record<string, any> = { status: operationForm.status };
        if (operation.endpoint === "/nursing/medications" && operationForm.administeredAt) payload.administeredAt = operationForm.administeredAt;
        if (operation.row && Object.prototype.hasOwnProperty.call(operation.row, "notes") && operationForm.notes) payload.notes = operationForm.notes;
        await api.patch(`${operation.endpoint}/${operation.row.id}`, payload);
      }
      setOperation(null);
      await load();
    } catch (err: any) {
      setError(readError(err));
    } finally {
      setPosting(false);
    }
  };

  const moduleActions = getModuleActions(selected.endpoint);
  const isDashboard = selected.key === "dashboard";
  const isAppointmentsCalendar = selected.endpoint === "/appointments";

  useEffect(() => {
    if (userLoading || !user) return;
    if (!canAccessModule) {
      const fallback = getFirstAccessibleHospitalModule(user);
      router.replace(fallback ? `/${locale}/hospital/${fallback.key}` : `/${locale}/overview`);
    }
  }, [canAccessModule, locale, router, user, userLoading]);

  if (userLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardSidebar />
        <div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-[84px]" : "lg:ml-[340px]"}`}>
          <DashboardNavbar />
          <main className="p-8">
            <div className="border border-slate-200 bg-white p-16 text-center text-sm font-semibold text-slate-500">
              <Loader2 className="mx-auto mb-3 size-6 animate-spin text-blue-700" />
              Vérification de vos autorisations...
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!canAccessModule) {
    return (
      <div className="min-h-screen bg-slate-50">
        <DashboardSidebar />
        <div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-[84px]" : "lg:ml-[340px]"}`}>
          <DashboardNavbar />
          <main className="p-8">
            <div className="border border-amber-200 bg-amber-50 p-8">
              <h1 className="text-xl font-black text-amber-950">Module non assigné</h1>
              <p className="mt-2 text-sm font-semibold text-amber-800">Vous êtes redirigé vers un module autorisé pour votre rôle.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-[84px]" : "lg:ml-[340px]"}`}>
        <DashboardNavbar />
        <main className="p-5 lg:p-8">
          {error && <ProfessionalError message={error} />}

          <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">Sous-modules</p>
                <h2 className="mt-1 text-base font-semibold text-slate-950">{module.shortTitle || module.title}</h2>
                <p className="mt-1 text-xs font-normal text-slate-500">Sélectionnez une fonction métier.</p>
              </div>
              <nav className="p-3">
                {module.resources.map((resource) => {
                  const active = resource.key === selected.key;
                  return (
                    <button
                      key={resource.key}
                      onClick={() => switchResource(resource)}
                      className={`mb-1.5 flex w-full items-center border-l-4 px-4 py-2.5 text-left transition ${active ? "border-blue-700 bg-blue-50 text-blue-800" : "border-transparent text-slate-700 hover:bg-slate-50"}`}
                    >
                      <span className="block text-sm font-medium leading-snug">{resource.title}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <section className="space-y-6">
              <section className="overflow-hidden border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-6 py-5">
                  <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-slate-950">{selected.title}</h2>
                      <p className="mt-1 text-sm font-medium text-slate-500">{selected.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selected.canCreate !== false && <button onClick={openCreate} className="inline-flex h-11 items-center gap-2 bg-blue-700 px-4 text-sm font-black text-white hover:bg-blue-800"><Plus className="size-4" />Nouveau</button>}
                      {moduleActions.map((action) => <button key={action.kind} onClick={() => openOperation(action.kind)} className="inline-flex h-11 items-center gap-2 border border-blue-700 bg-white px-4 text-sm font-black text-blue-800 hover:bg-blue-50"><action.icon className="size-4" />{action.label}</button>)}
                      <button onClick={load} className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"><RefreshCcw className="size-4" />Actualiser</button>
                      <button onClick={() => setPrintDialog({})} className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"><Printer className="size-4" />Documents</button>
                      <button className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"><Download className="size-4" />Exporter</button>
                    </div>
                  </div>
                  {!isDashboard && <label className="mt-5 flex h-12 max-w-xl items-center gap-3 border border-slate-200 bg-slate-50 px-4 focus-within:border-blue-700 focus-within:bg-white">
                    <Search className="size-5 text-slate-400" />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher" className="w-full bg-transparent text-sm font-semibold outline-none" />
                  </label>}
                </div>
                {isDashboard ? <DepartmentDashboard loading={loading} data={rows[0] ?? {}} columns={selected.columns} /> : isAppointmentsCalendar ? <AppointmentsCalendarView rows={filtered} loading={loading} onRefresh={load} onCreate={openCreate} /> : <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px]">
                    <thead className="bg-slate-50">
                      <tr>{selected.columns.map((column) => <th key={column.key} className="border-b border-slate-200 px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">{column.label}</th>)}<th className="border-b border-slate-200 px-5 py-4 text-right text-xs font-black uppercase tracking-wide text-slate-500">Actions</th></tr>
                    </thead>
                    <tbody>
                      {loading ? <tr><td colSpan={selected.columns.length + 1} className="px-5 py-20 text-center text-sm font-semibold text-slate-500"><Loader2 className="mx-auto mb-3 size-6 animate-spin text-blue-700" />Chargement des données...</td></tr> :
                      filtered.length ? filtered.map((row, index) => <tr key={row.id ?? index} className="border-t border-slate-100 hover:bg-slate-50">{selected.columns.map((column) => <td key={column.key} className="max-w-xs truncate px-5 py-4 text-sm font-semibold text-slate-700">{formatValue(row[column.key])}</td>)}<td className="px-5 py-4 text-right"><div className="inline-flex border border-slate-200"><button onClick={() => handlePrimaryView(selected.endpoint, row, router, locale)} className="px-3 py-2 text-slate-600 hover:bg-slate-50" title="Voir"><Eye className="size-4" /></button>{selected.canUpdate !== false && <button onClick={() => openEdit(row)} className="border-l border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50" title="Modifier"><Edit3 className="size-4" /></button>}<button onClick={() => setPrintDialog({ row })} className="border-l border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50" title="Documents"><Printer className="size-4" /></button>{getRowActions(selected.endpoint, row).map((action) => <button key={action.label} onClick={() => action.kind === "print-invoice" ? setPrintDialog({ row }) : action.kind === "patient-record" ? router.push(`/${locale}/hospital/patients/${row.patientId}`) : openOperation(action.kind, row)} className="border-l border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50" title={action.label}><action.icon className="size-4" /></button>)}</div></td></tr>) :
                      <tr><td colSpan={selected.columns.length + 1} className="px-5 py-20 text-center"><Database className="mx-auto mb-3 size-8 text-slate-300" /><p className="font-black text-slate-800">Aucune donnée disponible</p><p className="mt-1 text-sm text-slate-500">Cliquez sur “Nouveau” pour créer un enregistrement ou vérifiez vos droits d’accès.</p></td></tr>}
                    </tbody>
                  </table>
                </div>}
              </section>
            </section>
          </div>

          {operation && (
            <OperationDialog
              operation={operation}
              form={operationForm}
              setForm={setOperationForm}
              posting={posting}
              onClose={() => setOperation(null)}
              onSubmit={submitOperation}
            />
          )}

          {printDialog && (
            <PrintDialog
              moduleEndpoint={selected.endpoint}
              moduleTitle={selected.title}
              locale={locale as "fr" | "en"}
              row={printDialog.row}
              onClose={() => setPrintDialog(null)}
            />
          )}

          {formOpen && (
            <div className="fixed inset-0 z-[70] bg-slate-950/40">
              <div className="ml-auto h-full w-full max-w-3xl overflow-y-auto border-l border-slate-300 bg-white">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-7 py-5">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">{editingRow ? "Modifier" : "Nouvel enregistrement"}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{selected.title}</p>
                  </div>
                  <button onClick={() => setFormOpen(false)} className="border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"><X className="size-5" /></button>
                </div>
                <div className="p-7">
                  <div className="mb-6 grid grid-cols-2 border border-slate-200 bg-slate-50 p-1 text-sm font-black">
                    <button onClick={() => setMode("form")} className={`border px-3 py-2 ${mode === "form" ? "border-slate-900 bg-white text-slate-950" : "border-transparent text-slate-500"}`}>Formulaire</button>
                    <button onClick={() => setMode("json")} className={`border px-3 py-2 ${mode === "json" ? "border-slate-900 bg-white text-slate-950" : "border-transparent text-slate-500"}`}><FileJson className="mr-1 inline size-4" /> Avancé</button>
                  </div>

                  {selected.canCreate === false ? <p className="bg-slate-50 p-4 text-sm text-slate-500">Cette ressource est consultable ou nécessite une action métier dédiée.</p> : mode === "form" ? <div className="grid gap-5 md:grid-cols-2">{selected.fields.map((field) => <FieldInput key={field.name} field={field} value={form[field.name]} onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))} />)}</div> : <textarea value={rawJson} onChange={(event) => setRawJson(event.target.value)} className="h-[520px] w-full border border-slate-200 bg-slate-50 p-3 font-mono text-xs outline-none focus:border-blue-700 focus:bg-white" />}

                  <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-5">
                    <button onClick={() => setFormOpen(false)} className="h-12 border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 hover:bg-slate-50">Annuler</button>
                    <button disabled={posting || selected.canCreate === false} onClick={submit} className="inline-flex h-12 items-center justify-center gap-2 bg-blue-700 px-6 text-sm font-black text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
                      {posting ? <Loader2 className="size-4 animate-spin" /> : <><Send className="size-4" /></>} Enregistrer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


type OperationKind = "preview-invoice" | "generate-invoice" | "pay-invoice" | "validate-lab" | "discharge" | "stock-movement" | "complete-consultation" | "change-status" | "print-invoice" | "patient-record";
type OperationState = { kind: OperationKind; row?: any; endpoint?: string };

type OperationAction = { kind: OperationKind; label: string; icon: any };

function getModuleActions(endpoint: string): OperationAction[] {
  if (endpoint === "/billing/invoices") return [
    { kind: "preview-invoice", label: "Aperçu facture", icon: Receipt },
    { kind: "generate-invoice", label: "Générer facture", icon: FileText },
  ];
  if (endpoint === "/inventory/items") return [{ kind: "stock-movement", label: "Mouvement stock", icon: Database }];
  return [];
}

function getRowActions(endpoint: string, row: any): OperationAction[] {
  if (endpoint === "/billing/invoices") return [
    { kind: "print-invoice", label: "Imprimer PDF", icon: Printer },
    ...(Number(row?.balanceDue ?? 0) > 0 ? [{ kind: "pay-invoice" as const, label: "Encaisser", icon: CreditCard }] : []),
  ];
  const actions: OperationAction[] = [];
  if (row?.patientId && endpoint !== "/patients") actions.push({ kind: "patient-record", label: "Dossier patient", icon: UserRound });
  if (endpoint === "/laboratory/results" && !row?.validatedAt) actions.push({ kind: "validate-lab", label: "Valider résultat", icon: CheckCircle2 });
  if (endpoint === "/consultations" && row?.status !== "COMPLETED") actions.push({ kind: "complete-consultation", label: "Terminer consultation", icon: CheckCircle2 });
  if (endpoint === "/admissions" && row?.status !== "DISCHARGED") actions.push({ kind: "discharge", label: "Sortie patient", icon: FileText });
  if (row?.status && nextStatuses(endpoint, row.status).length) actions.push({ kind: "change-status", label: "Changer statut", icon: CheckCircle2 });
  return actions;
}

function handlePrimaryView(endpoint: string, row: any, router: ReturnType<typeof useRouter>, locale: string) {
  if (endpoint === "/patients" && row?.id) router.push(`/${locale}/hospital/patients/${row.id}`);
}

function defaultOperationForm(kind: OperationKind, row?: any, endpoint = "") {
  if (kind === "preview-invoice" || kind === "generate-invoice") return { patientId: row?.patientId ?? "", admissionId: row?.admissionId ?? "", from: "", to: "" };
  if (kind === "pay-invoice") return { amount: row?.balanceDue ?? "", method: "CASH", reference: "" };
  if (kind === "discharge") return { summary: "" };
  if (kind === "complete-consultation") return { assessment: row?.assessment ?? "", plan: row?.plan ?? "", notes: row?.notes ?? "" };
  if (kind === "stock-movement") return { stockItemId: row?.id ?? "", type: "RECEIPT", quantity: 1, reference: "" };
  if (kind === "change-status") return { status: nextStatuses(endpoint, row?.status)[0] ?? "", administeredAt: "", notes: "" };
  return {};
}

const APPOINTMENT_WEEK_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function AppointmentsCalendarView({ rows, loading, onRefresh, onCreate }: { rows: any[]; loading: boolean; onRefresh: () => void; onCreate: () => void }) {
  const [month, setMonth] = useState(monthKey(new Date()));
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [actionError, setActionError] = useState("");

  const calendarDays = useMemo(() => buildMonthDays(month), [month]);
  const visibleRows = useMemo(() => rows.filter((row) => dateKey(new Date(row.scheduledAt)).startsWith(month)), [month, rows]);
  const byDate = useMemo(() => {
    return visibleRows.reduce<Record<string, any[]>>((acc, row) => {
      const key = dateKey(new Date(row.scheduledAt));
      acc[key] = [...(acc[key] ?? []), row].sort((a, b) => String(a.scheduledAt).localeCompare(String(b.scheduledAt)));
      return acc;
    }, {});
  }, [visibleRows]);
  const selectedRows = byDate[selectedDate] ?? [];
  const upcoming = visibleRows.filter((row) => new Date(row.scheduledAt).getTime() >= Date.now() && !["CANCELLED", "NO_SHOW", "MISSED"].includes(row.status)).slice(0, 8);
  const stats = appointmentStats(visibleRows);

  const shift = (delta: number) => setMonth(shiftMonth(month, delta));
  const today = () => {
    const now = new Date();
    setMonth(monthKey(now));
    setSelectedDate(dateKey(now));
  };
  const updateStatus = async (appointment: any, status: string) => {
    setActionError("");
    try {
      await api.patch(`/appointments/${appointment.id}/status`, { status });
      setSelectedAppointment(null);
      await onRefresh();
    } catch (err: any) {
      setActionError(readError(err));
    }
  };
  const sendReminder = async (appointment: any) => {
    setSendingReminder(true);
    setActionError("");
    try {
      await api.post(`/appointments/${appointment.id}/reminder/email`, { to: reminderEmail || undefined, message: reminderMessage || undefined });
      setReminderEmail("");
      setReminderMessage("");
    } catch (err: any) {
      setActionError(readError(err));
    } finally {
      setSendingReminder(false);
    }
  };

  return <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
    <section className="border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-950">{formatMonth(month)}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">Agenda médical filtré selon vos droits. Le médecin voit uniquement ses propres rendez-vous.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-blue-700" />
          <button onClick={() => shift(-1)} className="flex size-10 items-center justify-center border border-slate-300 hover:bg-slate-50"><ChevronLeft className="size-4" /></button>
          <button onClick={today} className="h-10 border border-slate-300 px-4 text-sm font-black hover:bg-slate-50">Aujourd’hui</button>
          <button onClick={() => shift(1)} className="flex size-10 items-center justify-center border border-slate-300 hover:bg-slate-50"><ChevronRight className="size-4" /></button>
          <button onClick={onRefresh} className="flex size-10 items-center justify-center border border-slate-300 hover:bg-slate-50"><RefreshCcw className="size-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50">
        <AppointmentStat label="Total mois" value={visibleRows.length} />
        <AppointmentStat label="Aujourd’hui" value={stats.today} />
        <AppointmentStat label="Confirmés" value={stats.confirmed} />
        <AppointmentStat label="En attente" value={stats.pending} />
      </div>

      <div className="overflow-x-auto p-5">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-7 border border-slate-200">
            {APPOINTMENT_WEEK_DAYS.map((day) => <div key={day} className="border-r border-slate-200 bg-slate-50 p-3 text-center text-sm font-black text-slate-500 last:border-r-0">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 border border-t-0 border-slate-200">
            {calendarDays.map((day) => {
              const dayRows = byDate[day.fullDate] ?? [];
              return <div key={day.fullDate} className={`min-h-[132px] border-r border-t border-slate-200 p-2 last:border-r-0 ${day.inMonth ? "bg-white" : "bg-slate-50/80"}`}>
                <button onClick={() => setSelectedDate(day.fullDate)} className={`mb-2 inline-flex size-7 items-center justify-center text-xs font-black ${selectedDate === day.fullDate ? "bg-blue-700 text-white" : day.inMonth ? "text-slate-700 hover:bg-slate-100" : "text-slate-400"}`}>{day.date}</button>
                <div className="space-y-1">
                  {loading && !dayRows.length ? <div className="h-7 bg-slate-100" /> : dayRows.slice(0, 3).map((appointment) => <button key={appointment.id} onClick={() => { setSelectedAppointment(appointment); setReminderEmail(appointment.patientEmail ?? ""); }} className={`w-full truncate px-2 py-1.5 text-left text-xs font-black ${appointmentColor(appointment.status)}`}>{formatTime(new Date(appointment.scheduledAt))} · {appointment.patientFirstName} {appointment.patientLastName}</button>)}
                  {dayRows.length > 3 && <p className="text-xs font-black text-slate-400">+{dayRows.length - 3}</p>}
                </div>
              </div>;
            })}
          </div>
        </div>
      </div>
    </section>

    <aside className="space-y-6">
      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h3 className="text-lg font-black text-slate-950">Rendez-vous du {formatDateLabel(selectedDate)}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{selectedRows.length} rendez-vous</p>
        </div>
        <div className="divide-y divide-slate-100">
          {selectedRows.length ? selectedRows.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} onClick={() => { setSelectedAppointment(appointment); setReminderEmail(appointment.patientEmail ?? ""); }} />) : <div className="p-8 text-center text-sm font-semibold text-slate-400"><CalendarDays className="mx-auto mb-3 size-10 text-slate-300" />Aucun rendez-vous ce jour.</div>}
        </div>
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h3 className="text-lg font-black text-slate-950">Prochains rendez-vous</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">Liste prioritaire du mois.</p>
        </div>
        <div className="divide-y divide-slate-100">{upcoming.length ? upcoming.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} compact onClick={() => { setSelectedAppointment(appointment); setReminderEmail(appointment.patientEmail ?? ""); }} />) : <div className="p-6 text-sm font-semibold text-slate-400">Aucun prochain rendez-vous.</div>}</div>
      </section>

      <button onClick={onCreate} className="flex h-12 w-full items-center justify-center gap-2 bg-blue-700 px-5 text-sm font-black text-white hover:bg-blue-800"><Plus className="size-4" />Nouveau rendez-vous</button>
    </aside>

    {selectedAppointment && <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-2xl border border-slate-300 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div><h3 className="text-xl font-black text-slate-950">Détail rendez-vous</h3><p className="mt-1 text-sm font-semibold text-slate-500">{selectedAppointment.patientFirstName} {selectedAppointment.patientLastName}</p></div>
          <button onClick={() => setSelectedAppointment(null)} className="border border-slate-300 p-2"><X className="size-5" /></button>
        </div>
        <div className="space-y-5 p-6">
          {actionError && <ProfessionalError message={actionError} />}
          <div className="grid gap-4 md:grid-cols-2">
            <DetailBox icon={<CalendarDays className="size-5" />} label="Date" value={formatFullDateTime(selectedAppointment.scheduledAt)} />
            <DetailBox icon={<Clock className="size-5" />} label="Durée" value={`${selectedAppointment.durationMinutes ?? 30} minutes`} />
            <DetailBox icon={<UserRound className="size-5" />} label="Patient" value={`${selectedAppointment.patientFirstName} ${selectedAppointment.patientLastName} · ${selectedAppointment.medicalRecordNumber ?? "-"}`} />
            <DetailBox icon={<Stethoscope className="size-5" />} label="Médecin" value={`Dr ${selectedAppointment.doctorFirstName ?? ""} ${selectedAppointment.doctorLastName ?? ""}`} />
          </div>
          <div className="border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Motif</p><p className="mt-2 text-sm font-semibold text-slate-800">{selectedAppointment.reason || selectedAppointment.notes || "-"}</p></div>
          <div className="grid gap-3 md:grid-cols-3">
            <button onClick={() => updateStatus(selectedAppointment, "CONFIRMED")} className="h-11 border border-emerald-300 bg-emerald-50 text-sm font-black text-emerald-800">Confirmer</button>
            <button onClick={() => updateStatus(selectedAppointment, "CHECKED_IN")} className="h-11 border border-blue-300 bg-blue-50 text-sm font-black text-blue-800">Patient arrivé</button>
            <button onClick={() => updateStatus(selectedAppointment, "CANCELLED")} className="h-11 border border-rose-300 bg-rose-50 text-sm font-black text-rose-800">Annuler</button>
          </div>
          <div className="border border-slate-200 p-4">
            <h4 className="font-black text-slate-950">Rappel email</h4>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <TextField label="Email patient" value={reminderEmail} onChange={setReminderEmail} />
              <TextField label="Message court" value={reminderMessage} onChange={setReminderMessage} />
            </div>
            <button onClick={() => sendReminder(selectedAppointment)} disabled={sendingReminder} className="mt-4 inline-flex h-11 items-center gap-2 bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-50">{sendingReminder ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}Envoyer rappel</button>
          </div>
        </div>
      </div>
    </div>}
  </div>;
}

function AppointmentStat({ label, value }: { label: string; value: number }) { return <div className="border-r border-slate-200 p-4 last:border-r-0"><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-950">{value}</p></div>; }
function AppointmentCard({ appointment, compact, onClick }: { appointment: any; compact?: boolean; onClick: () => void }) { return <button onClick={onClick} className="w-full p-4 text-left hover:bg-slate-50"><div className="border-l-4 border-blue-700 pl-3"><div className="flex items-start justify-between gap-3"><h4 className="line-clamp-1 text-sm font-black text-slate-950">{appointment.patientFirstName} {appointment.patientLastName}</h4><span className={`shrink-0 px-2 py-0.5 text-[11px] font-black ${appointmentColor(appointment.status)}`}>{appointment.status}</span></div><p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500"><Clock className="size-3.5" />{formatTime(new Date(appointment.scheduledAt))} · {appointment.type}</p>{!compact && <p className="mt-1 text-xs font-semibold text-slate-500">Dr {appointment.doctorFirstName} {appointment.doctorLastName}</p>}</div></button>; }
function DetailBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="border border-slate-200 bg-slate-50 p-4"><div className="mb-2 text-blue-700">{icon}</div><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-slate-900">{value}</p></div>; }
function appointmentColor(status: string) { if (["CANCELLED", "NO_SHOW", "MISSED"].includes(status)) return "bg-rose-50 text-rose-700"; if (["CONFIRMED", "CHECKED_IN", "IN_PROGRESS"].includes(status)) return "bg-emerald-50 text-emerald-700"; if (status === "COMPLETED") return "bg-slate-100 text-slate-700"; return "bg-blue-50 text-blue-700"; }
function appointmentStats(rows: any[]) { const today = dateKey(new Date()); return { today: rows.filter((row) => dateKey(new Date(row.scheduledAt)) === today).length, confirmed: rows.filter((row) => ["CONFIRMED", "CHECKED_IN", "IN_PROGRESS"].includes(row.status)).length, pending: rows.filter((row) => ["REQUESTED", "SCHEDULED"].includes(row.status)).length }; }
function monthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function shiftMonth(month: string, delta: number) { const [year, value] = month.split("-").map(Number); const date = new Date(year, value - 1 + delta, 1); return monthKey(date); }
function buildMonthDays(month: string) { const [year, monthNumber] = month.split("-").map(Number); const firstDay = new Date(year, monthNumber - 1, 1); const startOffset = (firstDay.getDay() + 6) % 7; const startDate = new Date(year, monthNumber - 1, 1 - startOffset); return Array.from({ length: 42 }).map((_, index) => { const day = new Date(startDate); day.setDate(startDate.getDate() + index); return { date: day.getDate(), fullDate: dateKey(day), inMonth: day.getMonth() === monthNumber - 1 }; }); }
function formatMonth(month: string) { const [year, value] = month.split("-").map(Number); return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(year, value - 1, 1)); }
function formatDateLabel(value: string) { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value)); }
function formatTime(date: Date) { return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date); }
function formatFullDateTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(date); }

function PrintDialog({ moduleEndpoint, moduleTitle, locale, row, onClose }: { moduleEndpoint: string; moduleTitle: string; locale: "fr" | "en"; row?: any; onClose: () => void }) {
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("generic-record");
  const [watermark, setWatermark] = useState("CONFIDENTIEL");
  const [emailTo, setEmailTo] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState<"" | "preview" | "download" | "print" | "email">("");
  const [error, setError] = useState("");
  const moduleKey = moduleEndpoint.replace(/^\//, "");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    printService.templates()
      .then((response) => {
        if (!mounted) return;
        const list = response.templates ?? [];
        setTemplates(list);
        setSelectedTemplate(pickDefaultTemplate(list, moduleKey));
      })
      .catch((err) => mounted && setError(readError(err)))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [moduleKey]);

  const relevantTemplates = useMemo(() => {
    const category = categoryFromModule(moduleKey);
    const filtered = templates.filter((template) => template.defaultModule === moduleKey || template.category === category || template.key === "generic-record");
    return filtered.length ? filtered : templates;
  }, [moduleKey, templates]);

  const payload = (): any => ({
    template: selectedTemplate,
    module: moduleKey,
    recordId: row?.id,
    data: row?.id ? undefined : { module: moduleTitle, rowsCount: "Impression de liste", generatedAt: new Date().toISOString() },
    locale,
    watermark,
    includeQr: true,
    includeBarcode: true,
  });

  const run = async (action: "preview" | "download" | "print" | "email") => {
    setPosting(action);
    setError("");
    try {
      if (action === "preview") await printService.openPdf(payload(), "inline");
      if (action === "download") await printService.openPdf(payload(), "attachment");
      if (action === "print") await printService.print(payload());
      if (action === "email") {
        if (!emailTo.trim()) throw new Error("Saisissez l’adresse email du destinataire.");
        await printService.email({ ...payload(), to: emailTo.trim(), message });
      }
    } catch (err: any) {
      setError(readError(err));
    } finally {
      setPosting("");
    }
  };

  return <div className="fixed inset-0 z-[90] bg-slate-950/40">
    <div className="ml-auto h-full w-full max-w-3xl overflow-y-auto border-l border-slate-300 bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-7 py-5">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Documents & impression</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{moduleTitle}{row?.id ? ` · ${row.id}` : " · impression du module"}</p>
        </div>
        <button onClick={onClose} className="border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"><X className="size-5" /></button>
      </div>

      <div className="space-y-6 p-7">
        {error && <ProfessionalError message={error} />}
        {loading ? <div className="border border-slate-200 p-8 text-center text-sm font-semibold text-slate-500"><Loader2 className="mx-auto mb-3 size-5 animate-spin text-blue-700" />Chargement des modèles...</div> : <>
          <section className="border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">Modèle professionnel</p>
            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className="mt-3 w-full border border-slate-300 bg-white px-3 py-3 text-sm font-black text-slate-900 outline-none focus:border-blue-700">
              {relevantTemplates.map((template) => <option key={template.key} value={template.key}>{template.title} · {template.category}</option>)}
            </select>
            <p className="mt-2 text-xs font-semibold text-slate-500">{relevantTemplates.find((template) => template.key === selectedTemplate)?.description}</p>
          </section>

          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Watermark" value={watermark} onChange={setWatermark} />
            <TextField label="Destinataire email" value={emailTo} onChange={setEmailTo} />
          </div>
          <TextAreaField label="Message email" value={message} onChange={setMessage} />

          <section className="border border-slate-200 bg-white p-5">
            <h3 className="font-black text-slate-950">Contenu inclus automatiquement</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {["Logo & identité hôpital", "Patient / dossier", "QR code & code-barres", "Signature numérique", "Notice confidentialité", "Pagination"].map((item) => <div key={item} className="border border-slate-100 bg-slate-50 p-3 text-xs font-black text-slate-700">{item}</div>)}
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
            <button onClick={() => run("preview")} disabled={Boolean(posting)} className="inline-flex h-12 items-center gap-2 border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-50">{posting === "preview" ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}Aperçu</button>
            <button onClick={() => run("download")} disabled={Boolean(posting)} className="inline-flex h-12 items-center gap-2 border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-50">{posting === "download" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}Télécharger</button>
            <button onClick={() => run("print")} disabled={Boolean(posting)} className="inline-flex h-12 items-center gap-2 bg-blue-700 px-5 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50">{posting === "print" ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}Imprimer</button>
            <button onClick={() => run("email")} disabled={Boolean(posting)} className="inline-flex h-12 items-center gap-2 bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50">{posting === "email" ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}Email</button>
          </div>
        </>}
      </div>
    </div>
  </div>;
}

function OperationDialog({ operation, form, setForm, posting, onClose, onSubmit }: { operation: OperationState; form: Record<string, any>; setForm: (form: Record<string, any>) => void; posting: boolean; onClose: () => void; onSubmit: () => void }) {
  const title = operationTitle(operation.kind);
  return <div className="fixed inset-0 z-[80] bg-slate-950/40">
    <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto border-l border-slate-300 bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-7 py-5">
        <div><h2 className="text-2xl font-black text-slate-950">{title}</h2><p className="mt-1 text-sm font-semibold text-slate-500">Action métier sécurisée</p></div>
        <button onClick={onClose} className="border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"><X className="size-5" /></button>
      </div>
      <div className="space-y-5 p-7">
        {operation.kind === "preview-invoice" || operation.kind === "generate-invoice" ? <>
          <ReferenceField referenceKey="patientId" label="Patient" value={form.patientId} onChange={(v) => setForm({ ...form, patientId: v })} />
          <ReferenceField referenceKey="admissionId" label="Admission" value={form.admissionId} onChange={(v) => setForm({ ...form, admissionId: v })} />
          <TextField type="datetime-local" label="Du" value={form.from} onChange={(v) => setForm({ ...form, from: v })} />
          <TextField type="datetime-local" label="Au" value={form.to} onChange={(v) => setForm({ ...form, to: v })} />
          {form.preview && <pre className="max-h-80 overflow-auto border border-slate-200 bg-slate-50 p-4 text-xs">{JSON.stringify(form.preview, null, 2)}</pre>}
        </> : null}
        {operation.kind === "pay-invoice" ? <>
          <TextField type="number" label="Montant" value={form.amount} onChange={(v) => setForm({ ...form, amount: Number(v) })} />
          <SelectField label="Méthode" value={form.method} onChange={(v) => setForm({ ...form, method: v })} options={["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER"]} />
          <TextField label="Référence" value={form.reference} onChange={(v) => setForm({ ...form, reference: v })} />
        </> : null}
        {operation.kind === "discharge" ? <TextAreaField label="Résumé de sortie" value={form.summary} onChange={(v) => setForm({ ...form, summary: v })} /> : null}
        {operation.kind === "complete-consultation" ? <>
          <TextAreaField label="Évaluation / diagnostic" value={form.assessment} onChange={(v) => setForm({ ...form, assessment: v })} />
          <TextAreaField label="Plan de traitement" value={form.plan} onChange={(v) => setForm({ ...form, plan: v })} />
          <TextAreaField label="Notes finales" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
        </> : null}
        {operation.kind === "stock-movement" ? <>
          <ReferenceField referenceKey="stockItemId" label="Article stock" value={form.stockItemId} onChange={(v) => setForm({ ...form, stockItemId: v })} />
          <SelectField label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={["RECEIPT", "ISSUE", "TRANSFER", "ADJUSTMENT"]} />
          <TextField type="number" label="Quantité" value={form.quantity} onChange={(v) => setForm({ ...form, quantity: Number(v) })} />
          <TextField label="Référence" value={form.reference} onChange={(v) => setForm({ ...form, reference: v })} />
        </> : null}
        {operation.kind === "change-status" ? <>
          <div className="border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Statut actuel</p>
            <p className="mt-1 text-lg font-black text-slate-950">{operation.row?.status ?? "-"}</p>
          </div>
          <SelectField label="Nouveau statut" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={nextStatuses(operation.endpoint ?? "", operation.row?.status)} />
          {operation.endpoint === "/nursing/medications" && form.status === "ADMINISTERED" ? <TextField type="datetime-local" label="Administré le" value={form.administeredAt} onChange={(v) => setForm({ ...form, administeredAt: v })} /> : null}
          <TextAreaField label="Notes / justification" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
        </> : null}
        {operation.kind === "validate-lab" ? <p className="border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Confirmer la validation biologique de ce résultat. Cette action engage le validateur.</p> : null}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
          <button onClick={onClose} className="h-12 border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 hover:bg-slate-50">Annuler</button>
          <button disabled={posting} onClick={onSubmit} className="inline-flex h-12 items-center justify-center gap-2 bg-blue-700 px-6 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50">{posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Confirmer</button>
        </div>
      </div>
    </div>
  </div>;
}

function DepartmentDashboard({ loading, data, columns }: { loading: boolean; data: Record<string, any>; columns: { key: string; label: string }[] }) {
  if (loading) return <div className="p-16 text-center text-sm font-semibold text-slate-500"><Loader2 className="mx-auto mb-3 size-6 animate-spin text-blue-700" />Chargement du tableau de bord...</div>;
  const simple = columns.filter((column) => isSimpleDashboardValue(data?.[column.key]));
  const complex = columns.filter((column) => !isSimpleDashboardValue(data?.[column.key]));
  const alerts = simple.filter((column) => isAlertMetric(column.key, data?.[column.key]));
  return <div className="space-y-6 p-6">
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {simple.map((column) => <DashboardMetric key={column.key} label={column.label || humanize(column.key)} name={column.key} value={data?.[column.key]} />)}
    </div>

    {alerts.length ? <section className="border border-amber-300 bg-amber-50 p-5">
      <div className="mb-4 flex items-center gap-3"><AlertCircle className="size-5 text-amber-700" /><div><h3 className="font-black text-slate-950">Alertes à surveiller</h3><p className="text-sm font-semibold text-amber-800">Indicateurs opérationnels nécessitant un suivi.</p></div></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{alerts.map((column) => <div key={column.key} className="border border-amber-200 bg-white p-3"><p className="text-xs font-black uppercase text-amber-700">{humanize(column.key)}</p><p className="mt-1 text-2xl font-black text-slate-950">{formatValue(data?.[column.key])}</p></div>)}</div>
    </section> : null}

    {complex.length ? <div className="grid gap-6 xl:grid-cols-2">
      {complex.map((column) => <DashboardDataPanel key={column.key} title={column.label || humanize(column.key)} value={data?.[column.key]} />)}
    </div> : null}

    <div className="border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-lg font-black text-slate-950">Lecture opérationnelle</h3>
      <p className="mt-2 text-sm font-semibold text-slate-500">Les cartes affichent les KPI immédiats. Les graphiques et tableaux affichent les répartitions, classements et alertes calculés automatiquement par l’API.</p>
    </div>
  </div>;
}

function DashboardMetric({ label, name, value }: { label: string; name: string; value: any }) {
  const numeric = Number(value ?? 0);
  const percentage = name.toLowerCase().includes("rate") || name.toLowerCase().includes("occupancy") || name.toLowerCase().includes("compliance");
  const danger = isAlertMetric(name, value);
  return <div className={`border bg-white p-5 ${danger ? "border-amber-300" : "border-slate-200"}`}>
    <div className="flex items-start justify-between gap-4">
      <div className={`flex size-10 items-center justify-center text-white ${danger ? "bg-amber-600" : "bg-blue-700"}`}><Activity className="size-5" /></div>
      {percentage && <span className="border border-slate-200 px-2 py-1 text-xs font-black text-slate-600">%</span>}
    </div>
    <p className="mt-4 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-black text-slate-950">{formatDashboardNumber(value)}</p>
    {Number.isFinite(numeric) && numeric > 0 ? <div className="mt-4 h-2 bg-slate-100"><div className={`${danger ? "bg-amber-600" : "bg-blue-700"} h-full`} style={{ width: `${percentage ? Math.min(numeric, 100) : Math.min(Math.max(numeric, 8), 100)}%` }} /></div> : <div className="mt-4 h-2 bg-slate-100" />}
  </div>;
}

function DashboardDataPanel({ title, value }: { title: string; value: any }) {
  const rows = Array.isArray(value) ? value : objectToRows(value);
  const chartable = rows.filter((row) => Number.isFinite(Number(findNumericValue(row))));
  return <section className="border border-slate-200 bg-white p-5">
    <div className="mb-4 border-b border-slate-200 pb-3">
      <h3 className="font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{Array.isArray(value) ? `${rows.length} élément(s)` : "Données consolidées"}</p>
    </div>
    {chartable.length >= 2 ? <MiniBarRows rows={chartable.slice(0, 8)} /> : <KeyValueRows rows={rows.slice(0, 8)} />}
  </section>;
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

function KeyValueRows({ rows }: { rows: any[] }) {
  if (!rows.length) return <p className="bg-slate-50 p-4 text-sm font-semibold text-slate-500">Aucune donnée disponible.</p>;
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

function categoryFromModule(moduleKey: string) {
  if (moduleKey.startsWith("patients")) return "patient";
  if (moduleKey.startsWith("consultations") || moduleKey.startsWith("prescriptions")) return "consultation";
  if (moduleKey.startsWith("laboratory")) return "laboratory";
  if (moduleKey.startsWith("imaging")) return "radiology";
  if (moduleKey.startsWith("admissions") || moduleKey.startsWith("nursing")) return "hospitalization";
  if (moduleKey.startsWith("surgery") || moduleKey.startsWith("surgeries")) return "surgery";
  if (moduleKey.startsWith("maternity") || moduleKey.startsWith("pregnancies") || moduleKey.startsWith("prenatal") || moduleKey.startsWith("deliveries")) return "maternity";
  if (moduleKey.startsWith("pediatrics")) return "pediatrics";
  if (moduleKey.startsWith("pharmacy")) return "pharmacy";
  if (moduleKey.startsWith("billing")) return "billing";
  if (moduleKey.startsWith("accounting")) return "accounting";
  if (moduleKey.startsWith("insurance")) return "insurance";
  if (moduleKey.startsWith("ambulances")) return "ambulance";
  if (moduleKey.startsWith("emergencies")) return "emergency";
  if (moduleKey.startsWith("reports")) return "reports";
  return "generic";
}

function pickDefaultTemplate(templates: PrintTemplate[], moduleKey: string) {
  return templates.find((template) => template.defaultModule === moduleKey)?.key
    ?? templates.find((template) => template.category === categoryFromModule(moduleKey))?.key
    ?? "generic-record";
}

function operationTitle(kind: OperationKind) {
  return ({ "preview-invoice": "Aperçu de facture", "generate-invoice": "Générer une facture", "pay-invoice": "Encaissement", "validate-lab": "Validation laboratoire", discharge: "Sortie hospitalisation", "stock-movement": "Mouvement de stock", "complete-consultation": "Terminer la consultation", "change-status": "Changer le statut", "print-invoice": "Impression", "patient-record": "Dossier patient" } as Record<OperationKind, string>)[kind];
}

function validateOperation(kind: OperationKind, form: Record<string, any>) {
  if ((kind === "preview-invoice" || kind === "generate-invoice") && !form.patientId) throw new Error("Sélectionnez le patient pour calculer la facture.");
  if ((kind === "preview-invoice" || kind === "generate-invoice") && form.from && form.to && new Date(form.to).getTime() < new Date(form.from).getTime()) throw new Error("La date de fin de facture doit être après la date de début.");
  if (kind === "pay-invoice" && (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0)) throw new Error("Le montant encaissé doit être supérieur à 0.");
  if (kind === "stock-movement" && !form.stockItemId) throw new Error("Sélectionnez l’article de stock.");
  if (kind === "stock-movement" && (!Number.isFinite(Number(form.quantity)) || Number(form.quantity) <= 0)) throw new Error("La quantité du mouvement de stock doit être supérieure à 0.");
  if (kind === "discharge" && !String(form.summary ?? "").trim()) throw new Error("Le résumé de sortie est obligatoire.");
  if (kind === "complete-consultation" && (!String(form.assessment ?? "").trim() || !String(form.plan ?? "").trim())) throw new Error("Le diagnostic et le plan de traitement sont obligatoires.");
  if (kind === "change-status" && !String(form.status ?? "").trim()) throw new Error("Sélectionnez le nouveau statut.");
  if (kind === "change-status" && form.status === "ADMINISTERED" && "administeredAt" in form && !String(form.administeredAt ?? "").trim()) throw new Error("La date d’administration est obligatoire.");
}

function nextStatuses(endpoint: string, current?: string) {
  const key = endpoint.replace(/^\//, "") === "surgery" ? "surgeries" : endpoint.replace(/^\//, "");
  const transitions: Record<string, Record<string, string[]>> = {
    "laboratory/orders": { ORDERED: ["COLLECTED", "IN_PROGRESS", "CANCELLED"], COLLECTED: ["IN_PROGRESS", "VALIDATED", "CANCELLED"], IN_PROGRESS: ["VALIDATED", "CANCELLED"] },
    "laboratory/samples": { PENDING: ["COLLECTED", "RECEIVED", "REJECTED"], COLLECTED: ["RECEIVED", "REJECTED"], RECEIVED: ["IN_ANALYSIS", "REJECTED"], IN_ANALYSIS: ["DONE", "REJECTED"] },
    "imaging/orders": { ORDERED: ["IN_PROGRESS", "VALIDATED", "CANCELLED"], IN_PROGRESS: ["VALIDATED", "CANCELLED"] },
    "nursing/tasks": { PENDING: ["DONE", "MISSED", "CANCELLED"] },
    "nursing/medications": { SCHEDULED: ["ADMINISTERED", "MISSED", "REFUSED", "CANCELLED"] },
    "nursing/handovers": { DRAFT: ["SIGNED", "ARCHIVED"], SIGNED: ["ARCHIVED"] },
    "icu/care-plans": { ACTIVE: ["COMPLETED", "CANCELLED"] },
    "icu/transfers": { REQUESTED: ["APPROVED", "CANCELLED", "DECEASED"], APPROVED: ["TRANSFERRED", "CANCELLED", "DECEASED"] },
    surgeries: { SCHEDULED: ["IN_PROGRESS", "COMPLETED", "CANCELLED"], IN_PROGRESS: ["COMPLETED", "CANCELLED"] },
    "surgery/requests": { REQUESTED: ["APPROVED", "SCHEDULED", "CANCELLED"], APPROVED: ["SCHEDULED", "CANCELLED"], SCHEDULED: ["COMPLETED", "CANCELLED"] },
    "surgery/recoveries": { RECOVERY: ["STABLE", "TRANSFERRED", "COMPLICATION"], STABLE: ["TRANSFERRED"], COMPLICATION: ["STABLE", "TRANSFERRED"] },
    "blood-bank/products": { AVAILABLE: ["RESERVED", "ISSUED", "EXPIRED", "DISCARDED"], RESERVED: ["AVAILABLE", "ISSUED", "DISCARDED"] },
    "blood-bank/collections": { COLLECTED: ["VALIDATED", "REJECTED"] },
    "blood-bank/requests": { REQUESTED: ["APPROVED", "CANCELLED"], APPROVED: ["RESERVED", "ISSUED", "CANCELLED"], RESERVED: ["ISSUED", "CANCELLED"] },
    "blood-bank/crossmatches": { PENDING: ["COMPATIBLE", "INCOMPATIBLE"] },
    "blood-bank/transfusions": { ORDERED: ["ADMINISTERED", "REACTION", "CANCELLED"], ADMINISTERED: ["REACTION"] },
    pregnancies: { ACTIVE: ["DELIVERED", "CANCELLED", "CLOSED"], DELIVERED: ["CLOSED"] },
    "insurance/claims": { SUBMITTED: ["APPROVED", "REJECTED", "PAID"], APPROVED: ["PAID", "REJECTED"] },
    "procurement/orders": { DRAFT: ["SENT", "CANCELLED"], SENT: ["RECEIVED", "CANCELLED"] },
    "hr/employees": { PROBATION: ["ACTIVE", "SUSPENDED", "TERMINATED", "RESIGNED"], ACTIVE: ["ON_LEAVE", "SUSPENDED", "RETIRED", "TERMINATED", "RESIGNED"], ON_LEAVE: ["ACTIVE", "SUSPENDED"], SUSPENDED: ["ACTIVE", "TERMINATED", "RESIGNED"] },
    "hr/contracts": { DRAFT: ["ACTIVE", "TERMINATED", "EXPIRED"], ACTIVE: ["RENEWED", "TERMINATED", "EXPIRED"], RENEWED: ["ACTIVE", "TERMINATED", "EXPIRED"] },
    "hr/leave-requests": { REQUESTED: ["SUPERVISOR_APPROVED", "REJECTED", "CANCELLED"], SUPERVISOR_APPROVED: ["HR_APPROVED", "REJECTED"], HR_APPROVED: ["ACTIVE", "CANCELLED"], ACTIVE: ["COMPLETED", "CANCELLED"] },
    "hr/payroll-periods": { OPEN: ["PROCESSING", "LOCKED", "CANCELLED"], PROCESSING: ["OPEN", "LOCKED", "CANCELLED"] },
    "hr/payroll-runs": { DRAFT: ["VALIDATED", "CANCELLED"], VALIDATED: ["LOCKED", "CANCELLED"] },
    "hr/payslips": { DRAFT: ["PUBLISHED", "CANCELLED"], PUBLISHED: ["PAID"] },
    "hr/documents": { PENDING: ["APPROVED", "REJECTED"], APPROVED: ["ARCHIVED"], REJECTED: ["PENDING"] },
  };
  return transitions[key]?.[String(current ?? "")] ?? [];
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (value: any) => void; type?: string }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span><input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white" /></label>;
}
function TextAreaField({ label, value, onChange }: { label: string; value: any; onChange: (value: any) => void }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span><textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-40 w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white" /></label>;
}
function SelectField({ label, value, onChange, options }: { label: string; value: any; onChange: (value: any) => void; options: string[] }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span><select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}
function ReferenceField({ referenceKey, label, value, onChange }: { referenceKey: string; label: string; value: any; onChange: (value: string) => void }) {
  const reference = hospitalReferences[referenceKey];
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!reference) return;
    let mounted = true;
    setLoading(true);
    api.get(reference.endpoint)
      .then((response) => mounted && setOptions(normalizeRows(response.data).map((row) => ({ id: row.id, label: relationLabel(row, reference.labelKeys), description: relationLabel(row, reference.descriptionKeys ?? []) })).filter((option) => option.id)))
      .catch(() => mounted && setOptions([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [reference?.endpoint]);
  if (!reference) return <TextField label={label} value={value} onChange={onChange} />;
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span><Autocomplete value={String(value ?? "")} options={options} isLoading={loading} placeholder={"Sélectionner " + label.toLowerCase()} searchPlaceholder={"Rechercher " + label.toLowerCase()} emptyText="Aucun résultat" onSelect={(option) => onChange(option.id)} showIdFallback={false} /></label>;
}
function cleanObject(input: Record<string, any>) { return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== "" && value !== undefined && value !== null && value !== "{}" && value !== "[]")); }

function ProfessionalError({ message }: { message: string }) {
  const isMissingApp = message.toLowerCase().includes("application not found");
  return <div className="mb-6 border border-rose-200 bg-white p-5">
    <div className="flex gap-4">
      <div className="flex size-11 shrink-0 items-center justify-center bg-rose-50 text-rose-600"><AlertCircle className="size-5" /></div>
      <div>
        <h2 className="font-black text-slate-950">Connexion au serveur indisponible</h2>
        <p className="mt-1 text-sm text-slate-600">{isMissingApp ? "L’adresse du backend configurée dans le front ne correspond pas à une application Railway active." : message}</p>
        {isMissingApp && <p className="mt-2 text-xs font-semibold text-slate-500">Corriger NEXT_PUBLIC_API_BASE_URL / HOSPITAL_API_URL avec l’URL réelle du service API.</p>}
      </div>
    </div>
  </div>;
}

function FieldInput({ field, value, onChange }: { field: HospitalField; value: any; onChange: (value: any) => void }) {
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

  return <label className={field.type === "multiselect" ? "block md:col-span-2" : "block"}>
    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{field.label}{field.required ? " *" : ""}</span>
    {field.reference ? <Autocomplete value={String(value ?? "")} options={options} isLoading={loading} placeholder={field.placeholder || `Sélectionner ${field.label.toLowerCase()}`} searchPlaceholder={`Rechercher ${field.label.toLowerCase()}`} emptyText="Aucun résultat" onSelect={(option) => onChange(option.id)} showIdFallback={false} /> :
      field.type === "multiselect" ? <div className="grid gap-2 border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
        {(field.options ?? []).map((option) => {
          const checked = selectedValues.includes(option.value);
          return <label key={option.value} className={`flex items-center gap-2 border bg-white px-3 py-2 text-xs font-black ${checked ? "border-blue-700 text-blue-800" : "border-slate-200 text-slate-700"}`}>
            <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked ? [...selectedValues, option.value] : selectedValues.filter((item) => item !== option.value))} />
            {option.label}
          </label>;
        })}
      </div> :
      field.type === "select" && field.allowCustom ? <>
        <input list={datalistId} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder="Sélectionner ou créer..." className={base} />
        <datalist id={datalistId}>{(field.options ?? []).map((option) => <option key={option.value} value={option.value} />)}</datalist>
      </> :
      field.type === "select" ? <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={base}><option value="">-</option>{(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> :
      field.type === "json" ? <RichTextEditor value={jsonValueToEditor(value)} onChange={onChange} minHeight="min-h-32" /> :
      field.type === "textarea" ? <textarea value={typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2)} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className={`${base} h-28 text-sm`} /> :
      field.type === "checkbox" ? <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /> :
      <input type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : field.name === "password" ? "password" : "text"} value={value ?? ""} onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)} placeholder={field.name === "password" ? "Minimum 10 caractères" : field.placeholder} className={base} />}
  </label>;
}
function relationLabel(row: Record<string, any>, keys: string[]) { return keys.map((key) => formatValue(row[key])).filter((value) => value && value !== "-").join(" · ") || row.id || "-"; }
function normalizeRows(data: any): any[] { if (Array.isArray(data)) return data; if (Array.isArray(data?.data)) return data.data; if (Array.isArray(data?.items)) return data.items; return data && typeof data === "object" ? [data] : []; }
function defaultForm(fields: HospitalField[], row?: Record<string, any>) { return Object.fromEntries(fields.map((field) => [field.name, row?.[field.name] ?? (field.type === "json" ? "" : field.type === "number" ? 0 : field.type === "checkbox" ? false : field.type === "multiselect" ? [] : field.name === "active" ? "true" : "")])); }
function parseJsonPayload(value: string) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    throw new Error("Le JSON avancé est invalide. Corrigez la syntaxe avant d’enregistrer.");
  }
}
function cleanPayload(form: Record<string, any>, fields: HospitalField[]) {
  const out: Record<string, any> = {};
  for (const field of fields) {
    const value = form[field.name];
    if (field.required && (value === "" || value === undefined || value === null || value === "{}" || value === "[]")) throw new Error(`${field.label} est obligatoire`);
    if (field.required && field.type === "multiselect" && (!Array.isArray(value) || value.length === 0)) throw new Error(`${field.label} est obligatoire`);
    if (value === "" || value === undefined || value === null) continue;
    if (field.type === "multiselect") {
      out[field.name] = Array.isArray(value) ? value : String(value).split(",").map((item) => item.trim()).filter(Boolean);
      continue;
    }
    if (field.name === "password" && String(value).length < 10) throw new Error("Le mot de passe doit contenir au moins 10 caractères.");
    if (field.type === "number") {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) throw new Error(`${field.label} doit être un nombre valide`);
      out[field.name] = numeric;
      continue;
    }
    if (field.type === "json" && typeof value === "string") {
      try {
        out[field.name] = JSON.parse(value || "{}");
      } catch {
        out[field.name] = { content: value, format: "html" };
      }
      if (field.required && ((Array.isArray(out[field.name]) && out[field.name].length === 0) || (!Array.isArray(out[field.name]) && typeof out[field.name] === "object" && Object.keys(out[field.name] ?? {}).length === 0))) throw new Error(`${field.label} est obligatoire`);
      continue;
    }
    out[field.name] = value === "true" ? true : value === "false" ? false : value;
  }
  return out;
}
function formatValue(value: any) { if (value === null || value === undefined || value === "") return "-"; if (typeof value === "object") return JSON.stringify(value); return String(value); }
function readError(err: any) { const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? err?.message; return Array.isArray(msg) ? msg.join(", ") : String(msg || "Erreur inconnue"); }
function jsonValueToEditor(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.content === "string") return value.content;
  return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
}
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char] ?? char));
}
