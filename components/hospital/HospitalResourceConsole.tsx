"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, Database, Download, Edit3, Eye, FileText, Loader2, Plus, Printer, Receipt, RefreshCcw, Search, Send, Smartphone, UserRound, X } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { findHospitalModule, hospitalReferences } from "@/shared/config/hospital-modules";
import { hospitalText, hospitalUi, localizeHospitalModule } from "@/shared/config/hospital-i18n";
import { api } from "@/shared/lib/http/api";
import { useMe } from "@/shared/hooks/auth.hooks";
import { canAccessHospitalModule, canAccessHospitalResource, getAccessibleHospitalResources, getFirstAccessibleHospitalModule, hasHospitalModulePermission } from "@/shared/lib/auth/module-access";
import type { OperationAction, OperationKind, OperationState } from "@/components/hospital/resource-console/types";
import { cleanObject, cleanPayload, defaultForm, defaultOperationForm, formatValue, normalizeRows, readError, validateOperation, nextStatuses } from "@/components/hospital/resource-console/utils";
import { DepartmentDashboard } from "@/components/hospital/resource-console/DepartmentDashboard";
import { FieldInput } from "@/components/hospital/resource-console/FieldInput";
import { ProfessionalError } from "@/components/hospital/resource-console/ProfessionalError";
import { AppointmentsCalendarView } from "@/components/hospital/resource-console/AppointmentsCalendarView";
import { PrintDialog } from "@/components/hospital/resource-console/PrintDialog";
import { OperationDialog } from "@/components/hospital/resource-console/OperationDialog";

export default function HospitalResourceConsole() {
  const params = useParams<{ locale: string; module?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const locale = params.locale || "fr";
  const baseModule = findHospitalModule(params.module);
  const module = useMemo(() => localizeHospitalModule(baseModule, locale), [baseModule, locale]);
  const { data: user, isLoading: userLoading } = useMe();
  const accessibleResources = useMemo(() => (user ? getAccessibleHospitalResources(user, module) : module.resources), [module, user]);
  const selectedKey = searchParams.get("resource") || accessibleResources[0]?.key || module.resources[0]?.key;
  const selected = accessibleResources.find((item) => item.key === selectedKey) || accessibleResources[0] || module.resources[0];
  const canAccessModule = canAccessHospitalModule(user, module.key);
  const canAccessSelected = canAccessHospitalResource(user, module.key, selected?.key);
  const canCreateSelected = selected?.canCreate !== false && hasHospitalModulePermission(user, module.key, selected?.key, "CREATE");
  const canUpdateSelected = selected?.canUpdate !== false && hasHospitalModulePermission(user, module.key, selected?.key, "UPDATE");
  const canPrintSelected = hasHospitalModulePermission(user, module.key, selected?.key, "PRINT");
  const canExportSelected = hasHospitalModulePermission(user, module.key, selected?.key, "EXPORT");

  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Record<string, any>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [operation, setOperation] = useState<OperationState | null>(null);
  const [operationForm, setOperationForm] = useState<Record<string, any>>({});
  const [printDialog, setPrintDialog] = useState<{ row?: any } | null>(null);
  const [referenceLabels, setReferenceLabels] = useState<Record<string, Record<string, string>>>({});

  const load = async () => {
    if (!selected) return;
    if (userLoading || !user || !canAccessModule || !canAccessSelected) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.get(selected.endpoint, { params: selected.endpoint === "/appointments" ? { limit: 100 } : undefined });
      const dataRows = normalizeRows(response.data);
      let nextRows = dataRows;
      if (selected.endpoint === "/hr/attendance-events") {
        const employeesResponse = await api.get("/hr/employees", { params: { limit: 100 } });
        nextRows = buildAttendanceRegister(dataRows, normalizeRows(employeesResponse.data));
      }
      setRows(nextRows);
      setReferenceLabels(await buildReferenceLabels(selected.columns.map((column) => column.key), nextRows));
    } catch (err: any) {
      setRows([]);
      setReferenceLabels({});
      setError(readError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm(defaultForm(selected?.fields ?? []));
    load();
  }, [selected?.endpoint, userLoading, user?.id, canAccessModule, canAccessSelected]);

  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(term));
  }, [query, rows]);

  const openCreate = () => {
    if (!canCreateSelected) return;
    setEditingRow(null);
    setForm(defaultForm(selected?.fields ?? []));
    setFormOpen(true);
  };

  const openEdit = (row: any) => {
    if (!canUpdateSelected) return;
    setEditingRow(row);
    setForm(defaultForm(selected?.fields ?? [], row));
    setFormOpen(true);
  };

  const submit = async () => {
    if (!selected) return;
    if (editingRow?.id && !canUpdateSelected) return;
    if (!editingRow?.id && !canCreateSelected) return;
    setPosting(true);
    setError("");
    try {
      const effectiveFields = editingRow?.id && selected.endpoint === "/users" ? selected.fields.filter((field) => field.name !== "password") : selected.fields;
      const payload = cleanPayload(form, effectiveFields);
      if (editingRow?.id && selected.endpoint === "/users") {
        delete payload.password;
      }
      if (editingRow?.id && canUpdateSelected) {
        await api.patch(`${selected.endpoint}/${editingRow.id}`, payload);
      } else {
        await api.post(selected.endpoint, payload);
      }
      setForm(defaultForm(selected.fields));
      setFormOpen(false);
      setEditingRow(null);
      await load();
    } catch (err: any) {
      setError(readError(err));
    } finally {
      setPosting(false);
    }
  };

  const openOperation = (kind: OperationKind, row?: any) => {
    if (!canRunOperation(kind, canCreateSelected, canUpdateSelected, canPrintSelected)) return;
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

  const moduleActions = getModuleActions(selected.endpoint).filter((action) => canRunOperation(action.kind, canCreateSelected, canUpdateSelected, canPrintSelected));
  const isDashboard = selected.key === "dashboard" || (selected.canCreate === false && selected.fields.length === 0);
  const isAppointmentsCalendar = selected.endpoint === "/appointments";

  useEffect(() => {
    if (userLoading || !user) return;
    if (!canAccessModule) {
      const fallback = getFirstAccessibleHospitalModule(user);
      router.replace(fallback ? `/${locale}/hospital/${fallback.key}` : `/${locale}/overview`);
    }
  }, [canAccessModule, locale, router, user, userLoading]);

  useEffect(() => {
    if (userLoading || !user || !canAccessModule || canAccessSelected) return;
    const fallback = accessibleResources[0];
    if (fallback) router.replace(`/${locale}/hospital/${module.key}?resource=${fallback.key}`);
  }, [accessibleResources, canAccessModule, canAccessSelected, locale, module.key, router, user, userLoading]);

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

          <div className="space-y-6">
              <section className="overflow-hidden border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-6 py-5">
                  <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-slate-950">{selected.title}</h2>
                      <p className="mt-1 text-sm font-medium text-slate-500">{selected.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canCreateSelected && <button onClick={openCreate} className="inline-flex h-11 items-center gap-2 bg-blue-700 px-4 text-sm font-black text-white hover:bg-blue-800"><Plus className="size-4" />{hospitalUi(locale, "new")}</button>}
                      {selected.endpoint === "/hr/attendance-events" && <button onClick={() => router.push(`/${locale}/attendance-kiosk`)} className="inline-flex h-11 items-center gap-2 bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800"><Smartphone className="size-4" />Kiosque présence</button>}
                      {moduleActions.map((action) => <button key={action.kind} onClick={() => openOperation(action.kind)} className="inline-flex h-11 items-center gap-2 border border-blue-700 bg-white px-4 text-sm font-black text-blue-800 hover:bg-blue-50"><action.icon className="size-4" />{hospitalText(action.label, locale)}</button>)}
                      <button onClick={load} className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"><RefreshCcw className="size-4" />{hospitalUi(locale, "refresh")}</button>
                      {canPrintSelected && <button onClick={() => setPrintDialog({})} className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"><Printer className="size-4" />{hospitalUi(locale, "documents")}</button>}
                      {canExportSelected && <button className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"><Download className="size-4" />{hospitalUi(locale, "export")}</button>}
                    </div>
                  </div>
                  {!isDashboard && <label className="mt-5 flex h-12 max-w-xl items-center gap-3 border border-slate-200 bg-slate-50 px-4 focus-within:border-blue-700 focus-within:bg-white">
                    <Search className="size-5 text-slate-400" />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={hospitalUi(locale, "search")} className="w-full bg-transparent text-sm font-semibold outline-none" />
                  </label>}
                </div>
                {!canAccessSelected ? <div className="p-8 text-sm font-semibold text-amber-800">{hospitalUi(locale, "moduleNotAssigned")}</div> : isDashboard ? <DepartmentDashboard loading={loading} data={rows[0] ?? {}} columns={selected.columns} locale={locale} /> : isAppointmentsCalendar ? <AppointmentsCalendarView rows={filtered} loading={loading} onRefresh={load} onCreate={openCreate} locale={locale} /> : <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px]">
                    <thead className="bg-slate-50">
                      <tr>{selected.columns.map((column) => <th key={column.key} className="border-b border-slate-200 px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">{column.label}</th>)}<th className="border-b border-slate-200 px-5 py-4 text-right text-xs font-black uppercase tracking-wide text-slate-500">{hospitalUi(locale, "actions")}</th></tr>
                    </thead>
                    <tbody>
                      {loading ? <tr><td colSpan={selected.columns.length + 1} className="px-5 py-20 text-center text-sm font-semibold text-slate-500"><Loader2 className="mx-auto mb-3 size-6 animate-spin text-blue-700" />{hospitalUi(locale, "loadingData")}</td></tr> :
                      filtered.length ? filtered.map((row, index) => <tr key={row.id ?? index} className="border-t border-slate-100 hover:bg-slate-50">{selected.columns.map((column) => <td key={column.key} className="max-w-xs truncate px-5 py-4 text-sm font-semibold text-slate-700">{displayCell(row, column.key, referenceLabels)}</td>)}<td className="px-5 py-4 text-right"><div className="inline-flex border border-slate-200"><button onClick={() => handlePrimaryView(selected.endpoint, row, router, locale)} className="px-3 py-2 text-slate-600 hover:bg-slate-50" title="Voir"><Eye className="size-4" /></button>{canUpdateSelected && <button onClick={() => openEdit(row)} className="border-l border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50" title="Modifier"><Edit3 className="size-4" /></button>}{canPrintSelected && <button onClick={() => setPrintDialog({ row })} className="border-l border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50" title="Documents"><Printer className="size-4" /></button>}{getRowActions(selected.endpoint, row).filter((action) => canRunOperation(action.kind, canCreateSelected, canUpdateSelected, canPrintSelected)).map((action) => <button key={action.label} onClick={() => action.kind === "print-invoice" ? setPrintDialog({ row }) : action.kind === "patient-record" ? router.push(`/${locale}/hospital/patients/${row.patientId}`) : openOperation(action.kind, row)} className="border-l border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50" title={action.label}><action.icon className="size-4" /></button>)}</div></td></tr>) :
                      <tr><td colSpan={selected.columns.length + 1} className="px-5 py-20 text-center"><Database className="mx-auto mb-3 size-8 text-slate-300" /><p className="font-black text-slate-800">{hospitalUi(locale, "noData")}</p><p className="mt-1 text-sm text-slate-500">{hospitalUi(locale, "noDataHint")}</p></td></tr>}
                    </tbody>
                  </table>
                </div>}
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
              <div className="ml-auto h-full w-full overflow-y-auto border-l border-slate-300 bg-white xl:max-w-6xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-7 py-5">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">{editingRow ? hospitalUi(locale, "edit") : hospitalUi(locale, "newRecord")}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{selected.title}</p>
                  </div>
                  <button onClick={() => setFormOpen(false)} className="border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"><X className="size-5" /></button>
                </div>
                <div className="p-7">
                  {(!editingRow && !canCreateSelected) || (editingRow && !canUpdateSelected) ? <p className="bg-slate-50 p-4 text-sm text-slate-500">{hospitalUi(locale, "readOnlyResource")}</p> : <div className="grid gap-5 md:grid-cols-2">{selected.fields.map((field) => <FieldInput key={field.name} locale={locale} field={field} form={form} value={form[field.name]} onChange={(value) => setForm((current) => ({ ...current, [field.name]: value }))} />)}</div>}

                  <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-5">
                    <button onClick={() => setFormOpen(false)} className="h-12 border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 hover:bg-slate-50">{hospitalUi(locale, "cancel")}</button>
                    <button disabled={posting || (!editingRow && !canCreateSelected) || (Boolean(editingRow) && !canUpdateSelected)} onClick={submit} className="inline-flex h-12 items-center justify-center gap-2 bg-blue-700 px-6 text-sm font-black text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
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

async function buildReferenceLabels(keys: string[], rows: any[]) {
  const maps: Record<string, Record<string, string>> = {};
  const referenceKeys = [...new Set(keys.filter((key) => hospitalReferences[key] && rows.some((row) => row?.[key])))];
  await Promise.all(referenceKeys.map(async (key) => {
    const reference = hospitalReferences[key];
    if (!reference) return;
    try {
      const response = await api.get(reference.endpoint, { params: { limit: 500 } });
      maps[key] = Object.fromEntries(normalizeRows(response.data).map((row) => {
        const valueKey = reference.valueKey ?? "id";
        const id = String(row[valueKey] ?? row.id ?? "");
        return [id, referenceRowLabel(row, reference.labelKeys)];
      }).filter(([id, label]) => id && label));
    } catch {
      maps[key] = {};
    }
  }));
  return maps;
}

function displayCell(row: any, key: string, referenceLabels: Record<string, Record<string, string>>) {
  if (key === "id") return recordReference(row);
  if (key === "patientId" && row?.patientName) return [row.patientName, row.medicalRecordNumber].filter(Boolean).join(" · ");
  if (key === "practitionerId" && row?.practitionerName) return row.practitionerName;
  if (key === "prescriberId" && row?.prescriberName) return row.prescriberName;
  if (key === "attendingPractitionerId" && row?.attendingPractitionerName) return row.attendingPractitionerName;
  const value = row?.[key];
  const mapped = value !== undefined && value !== null ? referenceLabels[key]?.[String(value)] : undefined;
  if (mapped) return mapped;
  if (isUuid(value)) return "Référence non trouvée";
  return formatValue(value);
}

function recordReference(row: any) {
  const keys = ["invoiceNumber", "medicalRecordNumber", "employeeNumber", "badgeNumber", "code", "sku", "batchNumber", "donorNumber", "bagNumber", "name", "title", "chiefComplaint", "procedure", "status"];
  const value = keys.map((key) => row?.[key]).find((item) => item !== undefined && item !== null && item !== "");
  return formatValue(value ?? "-");
}

function referenceRowLabel(row: Record<string, any>, keys: string[]) {
  const label = keys.map((key) => row[key]).filter((value) => value !== undefined && value !== null && value !== "" && !isUuid(value)).map(formatValue).join(" · ");
  return label || recordReference(row);
}

function isUuid(value: any) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

function canRunOperation(kind: OperationKind, canCreate: boolean, canUpdate: boolean, canPrint: boolean) {
  if (kind === "print-invoice") return canPrint;
  if (kind === "preview-invoice" || kind === "generate-invoice" || kind === "stock-movement") return canCreate;
  if (kind === "patient-record") return true;
  return canUpdate;
}

function handlePrimaryView(endpoint: string, row: any, router: ReturnType<typeof useRouter>, locale: string) {
  if (endpoint === "/patients" && row?.id) router.push(`/${locale}/hospital/patients/${row.id}`);
}

function buildAttendanceRegister(events: any[], employees: any[]) {
  const employeesById = new Map(employees.map((employee) => [String(employee.id), employee]));
  const groups = new Map<string, any>();

  for (const event of events) {
    const employeeId = String(event.employeeId ?? event.employee?.id ?? "");
    if (!employeeId) continue;
    const eventDate = new Date(event.eventAt ?? event.createdAt);
    if (Number.isNaN(eventDate.getTime())) continue;
    const day = eventDate.toISOString().slice(0, 10);
    const key = `${employeeId}:${day}`;
    const employee = employeesById.get(employeeId) ?? event.employee ?? {};
    const fullName = [employee.firstName, employee.lastName].filter(Boolean).join(" ") || event.fullName || employee.employeeNumber || employeeId;
    const current = groups.get(key) ?? {
      id: employee.employeeNumber || employee.badgeNumber || employeeId,
      employeeId,
      fullName,
      day,
      checkInAt: null as Date | null,
      checkOutAt: null as Date | null,
    };

    if (event.type === "CHECK_IN" || event.type === "LATE") {
      if (!current.checkInAt || eventDate.getTime() < current.checkInAt.getTime()) current.checkInAt = eventDate;
    }
    if (event.type === "CHECK_OUT" || event.type === "EARLY_DEPARTURE") {
      if (!current.checkOutAt || eventDate.getTime() > current.checkOutAt.getTime()) current.checkOutAt = eventDate;
    }
    groups.set(key, current);
  }

  return Array.from(groups.values())
    .sort((a, b) => `${b.day}${b.fullName}`.localeCompare(`${a.day}${a.fullName}`))
    .map((row) => ({
      id: row.id,
      fullName: row.fullName,
      checkIn: formatAttendanceTime(row.checkInAt),
      checkOut: formatAttendanceTime(row.checkOutAt),
      workedDuration: formatWorkedDuration(row.checkInAt, row.checkOutAt),
    }));
}

function formatAttendanceTime(value?: Date | null) {
  if (!value) return "-";
  return value.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatWorkedDuration(checkIn?: Date | null, checkOut?: Date | null) {
  if (!checkIn || !checkOut) return "-";
  const minutes = Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return `${hours} h ${String(rest).padStart(2, "0")} min`;
}
