"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, Database, Download, Edit3, Eye, FileJson, FileText, Loader2, Mail, Plus, Printer, Receipt, RefreshCcw, Search, Send, UserRound, X } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { findHospitalModule } from "@/shared/config/hospital-modules";
import { hospitalText, hospitalUi, localizeHospitalModule } from "@/shared/config/hospital-i18n";
import type { HospitalResource } from "@/shared/types/hospital.types";
import { api } from "@/shared/lib/http/api";
import { printService, type PrintTemplate } from "@/shared/services/print.service";
import { useMe } from "@/shared/hooks/auth.hooks";
import { canAccessHospitalModule, getFirstAccessibleHospitalModule } from "@/shared/lib/auth/module-access";
import type { OperationAction, OperationKind, OperationState } from "@/components/hospital/resource-console/types";
import { cleanObject, cleanPayload, defaultForm, defaultOperationForm, formatValue, normalizeRows, parseJsonPayload, readError, validateOperation, nextStatuses } from "@/components/hospital/resource-console/utils";
import { DepartmentDashboard } from "@/components/hospital/resource-console/DepartmentDashboard";
import { FieldInput } from "@/components/hospital/resource-console/FieldInput";
import { ProfessionalError } from "@/components/hospital/resource-console/ProfessionalError";
import { AppointmentsCalendarView } from "@/components/hospital/resource-console/AppointmentsCalendarView";
import { ReferenceField, SelectField, TextAreaField, TextField } from "@/components/hospital/resource-console/ResourceFields";

export default function HospitalResourceConsole() {
  const params = useParams<{ locale: string; module?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const locale = params.locale || "fr";
  const baseModule = findHospitalModule(params.module);
  const module = useMemo(() => localizeHospitalModule(baseModule, locale), [baseModule, locale]);
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
              {hospitalUi(locale, "checkingAccess")}
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
              <h1 className="text-xl font-black text-amber-950">{hospitalUi(locale, "moduleNotAssigned")}</h1>
              <p className="mt-2 text-sm font-semibold text-amber-800">{hospitalUi(locale, "redirectedToAllowed")}</p>
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">{hospitalUi(locale, "submodules")}</p>
                <h2 className="mt-1 text-base font-semibold text-slate-950">{module.shortTitle || module.title}</h2>
                <p className="mt-1 text-xs font-normal text-slate-500">{hospitalUi(locale, "selectBusinessFunction")}</p>
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
                      {selected.canCreate !== false && <button onClick={openCreate} className="inline-flex h-11 items-center gap-2 bg-blue-700 px-4 text-sm font-black text-white hover:bg-blue-800"><Plus className="size-4" />{hospitalUi(locale, "new")}</button>}
                      {moduleActions.map((action) => <button key={action.kind} onClick={() => openOperation(action.kind)} className="inline-flex h-11 items-center gap-2 border border-blue-700 bg-white px-4 text-sm font-black text-blue-800 hover:bg-blue-50"><action.icon className="size-4" />{hospitalText(action.label, locale)}</button>)}
                      <button onClick={load} className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"><RefreshCcw className="size-4" />{hospitalUi(locale, "refresh")}</button>
                      <button onClick={() => setPrintDialog({})} className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"><Printer className="size-4" />{hospitalUi(locale, "documents")}</button>
                      <button className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"><Download className="size-4" />{hospitalUi(locale, "export")}</button>
                    </div>
                  </div>
                  {!isDashboard && <label className="mt-5 flex h-12 max-w-xl items-center gap-3 border border-slate-200 bg-slate-50 px-4 focus-within:border-blue-700 focus-within:bg-white">
                    <Search className="size-5 text-slate-400" />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={hospitalUi(locale, "search")} className="w-full bg-transparent text-sm font-semibold outline-none" />
                  </label>}
                </div>
                {isDashboard ? <DepartmentDashboard loading={loading} data={rows[0] ?? {}} columns={selected.columns} locale={locale} /> : isAppointmentsCalendar ? <AppointmentsCalendarView rows={filtered} loading={loading} onRefresh={load} onCreate={openCreate} locale={locale} /> : <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px]">
                    <thead className="bg-slate-50">
                      <tr>{selected.columns.map((column) => <th key={column.key} className="border-b border-slate-200 px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">{column.label}</th>)}<th className="border-b border-slate-200 px-5 py-4 text-right text-xs font-black uppercase tracking-wide text-slate-500">{hospitalUi(locale, "actions")}</th></tr>
                    </thead>
                    <tbody>
                      {loading ? <tr><td colSpan={selected.columns.length + 1} className="px-5 py-20 text-center text-sm font-semibold text-slate-500"><Loader2 className="mx-auto mb-3 size-6 animate-spin text-blue-700" />{hospitalUi(locale, "loadingData")}</td></tr> :
                      filtered.length ? filtered.map((row, index) => <tr key={row.id ?? index} className="border-t border-slate-100 hover:bg-slate-50">{selected.columns.map((column) => <td key={column.key} className="max-w-xs truncate px-5 py-4 text-sm font-semibold text-slate-700">{formatValue(row[column.key])}</td>)}<td className="px-5 py-4 text-right"><div className="inline-flex border border-slate-200"><button onClick={() => handlePrimaryView(selected.endpoint, row, router, locale)} className="px-3 py-2 text-slate-600 hover:bg-slate-50" title="Voir"><Eye className="size-4" /></button>{selected.canUpdate !== false && <button onClick={() => openEdit(row)} className="border-l border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50" title="Modifier"><Edit3 className="size-4" /></button>}<button onClick={() => setPrintDialog({ row })} className="border-l border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50" title="Documents"><Printer className="size-4" /></button>{getRowActions(selected.endpoint, row).map((action) => <button key={action.label} onClick={() => action.kind === "print-invoice" ? setPrintDialog({ row }) : action.kind === "patient-record" ? router.push(`/${locale}/hospital/patients/${row.patientId}`) : openOperation(action.kind, row)} className="border-l border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50" title={action.label}><action.icon className="size-4" /></button>)}</div></td></tr>) :
                      <tr><td colSpan={selected.columns.length + 1} className="px-5 py-20 text-center"><Database className="mx-auto mb-3 size-8 text-slate-300" /><p className="font-black text-slate-800">{hospitalUi(locale, "noData")}</p><p className="mt-1 text-sm text-slate-500">{hospitalUi(locale, "noDataHint")}</p></td></tr>}
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
              locale={locale}
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
                    <h2 className="text-2xl font-black text-slate-950">{editingRow ? hospitalUi(locale, "edit") : hospitalUi(locale, "newRecord")}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{selected.title}</p>
                  </div>
                  <button onClick={() => setFormOpen(false)} className="border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"><X className="size-5" /></button>
                </div>
                <div className="p-7">
                  <div className="mb-6 grid grid-cols-2 border border-slate-200 bg-slate-50 p-1 text-sm font-black">
                    <button onClick={() => setMode("form")} className={`border px-3 py-2 ${mode === "form" ? "border-slate-900 bg-white text-slate-950" : "border-transparent text-slate-500"}`}>{hospitalUi(locale, "form")}</button>
                    <button onClick={() => setMode("json")} className={`border px-3 py-2 ${mode === "json" ? "border-slate-900 bg-white text-slate-950" : "border-transparent text-slate-500"}`}><FileJson className="mr-1 inline size-4" /> {hospitalUi(locale, "advanced")}</button>
                  </div>

                  {selected.canCreate === false ? <p className="bg-slate-50 p-4 text-sm text-slate-500">{hospitalUi(locale, "readOnlyResource")}</p> : mode === "form" ? <div className="grid gap-5 md:grid-cols-2">{selected.fields.map((field) => <FieldInput key={field.name} locale={locale} field={field} value={form[field.name]} onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))} />)}</div> : <textarea value={rawJson} onChange={(event) => setRawJson(event.target.value)} className="h-[520px] w-full border border-slate-200 bg-slate-50 p-3 font-mono text-xs outline-none focus:border-blue-700 focus:bg-white" />}

                  <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-5">
                    <button onClick={() => setFormOpen(false)} className="h-12 border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 hover:bg-slate-50">{hospitalUi(locale, "cancel")}</button>
                    <button disabled={posting || selected.canCreate === false} onClick={submit} className="inline-flex h-12 items-center justify-center gap-2 bg-blue-700 px-6 text-sm font-black text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
                      {posting ? <Loader2 className="size-4 animate-spin" /> : <><Send className="size-4" /></>} {hospitalUi(locale, "save")}
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

function OperationDialog({ operation, form, setForm, posting, locale = "fr", onClose, onSubmit }: { operation: OperationState; form: Record<string, any>; setForm: (form: Record<string, any>) => void; posting: boolean; locale?: string; onClose: () => void; onSubmit: () => void }) {
  const title = hospitalText(operationTitle(operation.kind), locale);
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
