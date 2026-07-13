"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Activity, Baby, BadgeDollarSign, CheckCircle2, CreditCard, Database, Download, Edit3, Eye, FileText, Loader2, Monitor, Plus, Printer, Receipt, RefreshCcw, Search, Send, Smartphone, UploadCloud, UserRound, X } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { findHospitalModule, hospitalReferences } from "@/shared/config/hospital-modules";
import { hospitalText, hospitalUi, localizeHospitalModule } from "@/shared/config/hospital-i18n";
import { api } from "@/shared/lib/http/api";
import { printService } from "@/shared/services/print.service";
import { useMe } from "@/shared/hooks/auth.hooks";
import { canAccessHospitalModule, canAccessHospitalResource, getAccessibleHospitalResources, getFirstAccessibleHospitalModule, hasHospitalModulePermission } from "@/shared/lib/auth/module-access";
import type { OperationAction, OperationKind, OperationState } from "@/components/hospital/resource-console/types";
import { cleanObject, cleanPayload, defaultForm, defaultOperationForm, formatValue, invoiceApiPayload, isTechnicalKey, isUuid, normalizeRows, readError, relationLabel, validateOperation, nextStatuses } from "@/components/hospital/resource-console/utils";
import { DepartmentDashboard } from "@/components/hospital/resource-console/DepartmentDashboard";
import { FieldInput } from "@/components/hospital/resource-console/FieldInput";
import { ProfessionalError } from "@/components/hospital/resource-console/ProfessionalError";
import { AppointmentsCalendarView } from "@/components/hospital/resource-console/AppointmentsCalendarView";
import { PrintDialog } from "@/components/hospital/resource-console/PrintDialog";
import { OperationDialog } from "@/components/hospital/resource-console/OperationDialog";

type MissingPricingRow = {
  serviceCode: string;
  description: string;
  count: number;
  unitPrice: string;
  insurancePrice: string;
};

type MissingPricingState = {
  name: string;
  currency: string;
  validFrom: string;
  rows: MissingPricingRow[];
};

export default function HospitalResourceConsole() {
  const params = useParams<{ locale: string; module?: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const locale = params.locale || "fr";
  const printLocale: "fr" | "en" = locale === "en" ? "en" : "fr";
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
  const canPrintSelected = hasHospitalModulePermission(user, module.key, selected?.key, "PRINT") || selected?.endpoint === "/prescriptions";

  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Record<string, any>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [viewRow, setViewRow] = useState<any | null>(null);
  const [operation, setOperation] = useState<OperationState | null>(null);
  const [operationForm, setOperationForm] = useState<Record<string, any>>({});
  const [missingPricing, setMissingPricing] = useState<MissingPricingState | null>(null);
  const [printDialog, setPrintDialog] = useState<{ row?: any } | null>(null);
  const [referenceLabels, setReferenceLabels] = useState<Record<string, Record<string, string>>>({});
  const [importingWho, setImportingWho] = useState(false);

  const load = async () => {
    if (!selected) return;
    if (userLoading || !user || !canAccessModule || !canAccessSelected) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.get(selected.endpoint, { params: resourceQueryParams(selected.endpoint, debouncedQuery, fromDate, toDate, statusFilter, page, pageSize) });
      const dataRows = normalizeRows(response.data);
      setTotalRows(readTotalRows(response.data, dataRows.length));
      let nextRows = dataRows;
      if (selected.endpoint === "/hr/attendance-events") {
        const employeesResponse = await api.get("/hr/employees", { params: { limit: 100 } });
        nextRows = buildAttendanceRegister(dataRows, normalizeRows(employeesResponse.data));
      }
      setRows(nextRows);
      setReferenceLabels(await buildReferenceLabels(referenceKeysForRows(selected.columns.map((column) => column.key), nextRows), nextRows));
    } catch (err: any) {
      const message = readError(err);
      setRows([]);
      setTotalRows(0);
      setReferenceLabels({});
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm(defaultForm(selected?.fields ?? []));
    load();
  }, [selected?.endpoint, userLoading, user?.id, canAccessModule, canAccessSelected, debouncedQuery, fromDate, toDate, statusFilter, page, pageSize]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setQuery("");
    setDebouncedQuery("");
    setFromDate("");
    setToDate("");
    setStatusFilter("");
    setPage(1);
  }, [selected?.endpoint]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, fromDate, toDate, statusFilter, pageSize]);

  const filtered = rows;
  const pageCount = Math.max(1, Math.ceil(Math.max(totalRows, filtered.length) / pageSize));
  const statusOptions = useMemo(() => {
    const statusField = selected?.fields?.find((field: any) => field.name === "status" && Array.isArray(field.options));
    return (statusField?.options ?? []).map((option: any) => ({
      value: String(option?.value ?? option),
      label: String(option?.label ?? option?.value ?? option),
    })).filter((option: any) => option.value);
  }, [selected?.fields]);

  useEffect(() => {
    if (statusFilter && !statusOptions.some((option) => option.value === statusFilter)) setStatusFilter("");
  }, [statusFilter, statusOptions]);

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

  const openView = (row: any) => {
    if (selected.endpoint === "/patients" && row?.id) {
      router.push(`/${locale}/hospital/patients/${row.id}`);
      return;
    }
    setViewRow(row);
  };

  const closeQueueEncounter = async (row: any) => {
    if (!row?.id) return;
    setPosting(true);
    setError("");
    try {
      await api.patch(`/reception/waiting-room/${row.id}/close`);
      toast.success("Passage patient clôturé.");
      await load();
    } catch (err: any) {
      const message = await readDownloadError(err);
      setError(message);
      toast.error(message);
    } finally {
      setPosting(false);
    }
  };

  const downloadBackup = async (row: any) => {
    if (!row?.id) return;
    setPosting(true);
    setError("");
    try {
      await downloadBackupFile(row.id, row.fileName);
      toast.success("Sauvegarde téléchargée.");
    } catch (err: any) {
      if (err?.response?.status === 404) {
        try {
          toast.message("Sauvegarde introuvable. Création d’une nouvelle sauvegarde...");
          const created = await api.post("/backups", { scope: "DATABASE" });
          const fresh = await waitForBackupCompletion(created.data?.id);
          await downloadBackupFile(fresh.id, fresh.fileName);
          toast.success("Nouvelle sauvegarde téléchargée.");
          await load();
        } catch (fallbackError: any) {
          const message = await readDownloadError(fallbackError);
          setError(message);
          toast.error(message);
        }
      } else {
        const message = await readDownloadError(err);
        setError(message);
        toast.error(message);
      }
    } finally {
      setPosting(false);
    }
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
      let savedRow: any = null;
      if (editingRow?.id && canUpdateSelected) {
        const response = await api.patch(`${selected.endpoint}/${editingRow.id}`, payload);
        savedRow = response.data;
      } else {
        const response = await api.post(selected.endpoint, payload);
        savedRow = response.data;
      }
      setForm(defaultForm(selected.fields));
      setFormOpen(false);
      setEditingRow(null);
      toast.success(editingRow?.id ? "Enregistrement modifié avec succès." : "Enregistrement créé avec succès.");
      await load();
      if (selected.endpoint === "/prescriptions" && savedRow?.id) setPrintDialog({ row: savedRow });
    } catch (err: any) {
      const message = readError(err);
      setError(message);
      toast.error(message);
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
        const { collectNow, paymentMethod, paymentAmount, paymentReference } = operationForm;
        const response = await api.post("/billing/invoices", invoiceApiPayload(operationForm));
        const invoice = response.data;
        if (collectNow && invoice?.id) {
          const amount = Number(paymentAmount || invoice.balanceDue || invoice.total || 0);
          if (amount > 0) {
            await api.post(`/billing/invoices/${invoice.id}/payments`, cleanObject({
              amount,
              method: paymentMethod || "CASH",
              reference: paymentReference,
            }));
          }
        }
        if (invoice?.id && operationForm.sourceType === "DISPENSATION") {
          await printService.print({ template: "pharmacy-invoice", module: "billing/invoices", recordId: invoice.id, locale: printLocale, includeQr: true, includeBarcode: true });
        }
        toast.success(collectNow ? "Facture générée et encaissement enregistré." : "Facture générée avec succès.");
      }
      if (operation.kind === "preview-invoice") {
        const response = await api.post("/billing/invoices/preview", invoiceApiPayload(operationForm));
        setOperationForm((current) => ({ ...current, preview: response.data }));
        setPosting(false);
        return;
      }
      if (operation.kind === "pay-invoice" && operation.row?.id) {
        await api.post(`/billing/invoices/${operation.row.id}/payments`, cleanObject(operationForm));
        toast.success("Paiement enregistré avec succès.");
      }
      if (operation.kind === "validate-lab" && operation.row?.id) {
        await api.patch(`/laboratory/results/${operation.row.id}/validate`, {});
        toast.success("Résultat laboratoire validé.");
      }
      if (operation.kind === "discharge" && operation.row?.id) {
        await api.patch(`/admissions/${operation.row.id}/discharge`, cleanObject(operationForm));
        toast.success("Sortie patient enregistrée.");
      }
      if (operation.kind === "complete-consultation" && operation.row?.id) {
        await api.patch(`/consultations/${operation.row.id}/complete`, cleanObject(operationForm));
        toast.success("Consultation clôturée.");
      }
      if (operation.kind === "confirm-birth") {
        const payload = cleanObject({
          pregnancyId: operationForm.pregnancyId,
          motherPatientId: operationForm.motherPatientId,
          deliveryAt: operationForm.deliveryAt,
          newborns: [{
            firstName: operationForm.firstName,
            lastName: operationForm.lastName,
            gender: operationForm.gender,
            birthWeightGrams: operationForm.birthWeightGrams === "" ? undefined : Number(operationForm.birthWeightGrams),
            apgar1: operationForm.apgar1 === "" ? undefined : Number(operationForm.apgar1),
            apgar5: operationForm.apgar5 === "" ? undefined : Number(operationForm.apgar5),
            apgar10: operationForm.apgar10 === "" ? undefined : Number(operationForm.apgar10),
            cordPh: operationForm.cordPh === "" ? undefined : Number(operationForm.cordPh),
            deliveryType: operationForm.deliveryType,
          }],
        });
        const response = await api.post("/maternity/births/confirm", payload);
        const documentId = normalizeRows(response.data?.documents)[0]?.id;
        if (documentId) {
          await printService.print({ template: "birth-statement", module: "maternity/birth-documents", recordId: documentId, locale: printLocale, includeQr: true, includeBarcode: true });
        }
        toast.success("Naissance confirmée, dossier nouveau-né créé et constat généré.");
      }
      if (operation.kind === "send-to-surgery" && operation.row?.id) {
        await api.post(`/maternity/pregnancy-records/${operation.row.id}/send-to-surgery`, cleanObject(operationForm));
        toast.success("Patiente envoyée au bloc opératoire.");
      }
      if (operation.kind === "stock-movement") {
        await api.post("/inventory/items/movements", cleanObject(operationForm));
        toast.success("Mouvement de stock enregistré.");
      }
      if (operation.kind === "surgery-status" && operation.row?.id) {
        await api.patch(`/surgery/slots/${operation.row.id}/status`, { status: operationForm.status });
        toast.success("Statut du bloc mis à jour.");
      }
      if (operation.kind === "validate-material-count" && operation.row?.id) {
        await api.post(`/surgery/slots/${operation.row.id}/validate-count`, {});
        toast.success("Comptage chirurgical conforme.");
      }
      if (operation.kind === "validate-oms-step" && operation.row?.id) {
        await api.patch(`/surgery/checklists/${operation.row.id}/${operationForm.step}`, {});
        toast.success("Étape OMS validée.");
      }
      if (operation.kind === "administer-medication" && operation.row?.id) {
        await api.patch(`/nursing/medications/${operation.row.id}/administer`, cleanObject(operationForm));
        toast.success("Médicament administré et stock mis à jour.");
      }
      if (operation.kind === "complete-nursing-task" && operation.row?.id) {
        await api.patch(`/nursing/tasks/${operation.row.id}/status`, cleanObject(operationForm));
        toast.success("Soin infirmier mis à jour.");
      }
      if (operation.kind === "resend-user-invitation" && operation.row?.id) {
        const response = await api.post(`/users/${operation.row.id}/resend-invitation`, {});
        const status = response.data?.invitationEmailStatus;
        toast.success(status === "SENT" ? "Invitation envoyée par email." : `Invitation traitée: ${status ?? "statut inconnu"}.`);
      }
      if (operation.kind === "change-status" && operation.row?.id && operation.endpoint) {
        const payload: Record<string, any> = { status: operationForm.status };
        if (operation.endpoint === "/nursing/medications" && operationForm.administeredAt) payload.administeredAt = operationForm.administeredAt;
        if (operation.row && Object.prototype.hasOwnProperty.call(operation.row, "notes") && operationForm.notes) payload.notes = operationForm.notes;
        await api.patch(`${operation.endpoint}/${operation.row.id}`, payload);
        toast.success("Statut mis à jour.");
      }
      setOperation(null);
      await load();
    } catch (err: any) {
      if (operation.kind === "generate-invoice" && err?.response?.data?.code === "UNPRICED_SERVICES") {
        setMissingPricing(buildMissingPricingState(err.response.data.services, operationForm));
        setError("");
        toast.warning("Configurez les tarifs manquants avant de générer la facture.");
        return;
      }
      const message = readError(err);
      setError(message);
      toast.error(message);
    } finally {
      setPosting(false);
    }
  };

  const completeMissingPricing = async () => {
    if (!missingPricing || !operation) return;
    setPosting(true);
    setError("");
    try {
      const services = await ensurePricingServices(missingPricing.rows);
      const items = missingPricing.rows.map((row) => {
        const service = services.find((item) => item.code === row.serviceCode);
        const unitPrice = Number(row.unitPrice);
        if (!service?.id) throw new Error(`Prestation introuvable: ${row.serviceCode}`);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error(`Prix invalide pour ${row.serviceCode}`);
        return {
          serviceId: service.id,
          unitPrice,
          ...(row.insurancePrice === "" || row.insurancePrice === undefined || row.insurancePrice === null ? {} : { insurancePrice: Number(row.insurancePrice) }),
        };
      });
      if (!items.length) throw new Error("Ajoutez au moins un tarif.");
      const response = await api.post("/pricing/price-lists", {
        name: missingPricing.name,
        currency: missingPricing.currency,
        validFrom: missingPricing.validFrom,
        items,
      });
      await api.patch(`/pricing/price-lists/${response.data.id}/activate`);
      await api.post("/billing/invoices", invoiceApiPayload(operationForm));
      setMissingPricing(null);
      setOperation(null);
      await load();
      toast.success("Tarifs créés et facture générée avec succès.");
    } catch (err: any) {
      const message = readError(err);
      setError(message);
      toast.error(message);
    } finally {
      setPosting(false);
    }
  };

  const importWhoGrowthFile = async (file?: File | null) => {
    if (!file || selected.endpoint !== "/pediatrics/who-growth-standards") return;
    setImportingWho(true);
    setError("");
    try {
      const rows = await parseWhoGrowthFile(file);
      if (!rows.length) throw new Error("Le fichier ne contient aucune ligne OMS importable.");
      const response = await api.post("/pediatrics/who-growth-standards/import", rows);
      await load();
      toast.success(response.data?.message || `${rows.length} lignes OMS importées.`);
    } catch (err: any) {
      const message = readError(err);
      setError(message);
      toast.error(message);
    } finally {
      setImportingWho(false);
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <DashboardSidebar />
        <div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-[84px]" : "lg:ml-[340px]"}`}>
          <DashboardNavbar />
          <main className="p-8">
            <div className="border border-slate-200 bg-white p-16 text-center text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-[84px]" : "lg:ml-[340px]"}`}>
        <DashboardNavbar />
        <main className="p-5 lg:p-8">
          {error && <ProfessionalError message={error} />}

          <div className="space-y-6">
              <section className="overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                  <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-slate-950 dark:text-white">{selected.title}</h2>
                      <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{selected.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {canCreateSelected && <button onClick={openCreate} className="inline-flex h-11 items-center gap-2 bg-blue-700 px-4 text-sm font-black text-white hover:bg-blue-800"><Plus className="size-4" />{hospitalUi(locale, "new")}</button>}
                      {selected.endpoint === "/pediatrics/who-growth-standards" && canCreateSelected && <label className="inline-flex h-11 cursor-pointer items-center gap-2 border border-emerald-600 bg-emerald-50 px-4 text-sm font-black text-emerald-800 hover:bg-emerald-100">
                        {importingWho ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                        Importer OMS
                        <input type="file" accept=".xlsx,.xls,.json,.csv,.txt,text/csv,application/json" className="hidden" disabled={importingWho} onChange={(event) => { importWhoGrowthFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                      </label>}
                      {selected.endpoint === "/hr/attendance-events" && <button onClick={() => router.push(`/${locale}/attendance-kiosk`)} className="inline-flex h-11 items-center gap-2 bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800"><Smartphone className="size-4" />Kiosque présence</button>}
                      {module.key === "reception" && <button onClick={() => router.push(`/${locale}/doctor/waiting-room`)} className="inline-flex h-11 items-center gap-2 bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800"><Activity className="size-4" />Gérer les appels</button>}
                      {module.key === "reception" && <button onClick={() => window.open(`/${locale}/waiting-room/display`, "_blank", "noopener,noreferrer")} className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"><Monitor className="size-4" />Écran TV</button>}
                      {module.key === "reception" && <button onClick={() => window.open(`/${locale}/ticket-kiosk`, "_blank", "noopener,noreferrer")} className="inline-flex h-11 items-center gap-2 border border-blue-700 bg-white px-4 text-sm font-black text-blue-800 hover:bg-blue-50"><Printer className="size-4" />Impression tickets</button>}
                      {moduleActions.map((action) => <button key={action.kind} onClick={() => openOperation(action.kind)} className="inline-flex h-11 items-center gap-2 border border-blue-700 bg-white px-4 text-sm font-black text-blue-800 hover:bg-blue-50"><action.icon className="size-4" />{hospitalText(action.label, locale)}</button>)}
                      <button onClick={load} className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"><RefreshCcw className="size-4" />{hospitalUi(locale, "refresh")}</button>
                    </div>
                  </div>
                  {!isDashboard && <div className={`mt-5 grid gap-3 ${statusOptions.length ? "lg:grid-cols-[minmax(260px,1fr)_170px_170px_180px_auto]" : "lg:grid-cols-[minmax(260px,1fr)_170px_170px_auto]"}`}>
                    <label className="flex h-12 items-center gap-3 border border-slate-200 bg-slate-50 px-4 focus-within:border-blue-700 focus-within:bg-white">
                      <Search className="size-5 shrink-0 text-slate-400" />
                      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Recherche globale: patient, dossier, médicament, référence..." className="w-full min-w-0 bg-transparent text-sm font-semibold outline-none" />
                    </label>
                    <label className="h-12 border border-slate-200 bg-slate-50 px-3 py-1 focus-within:border-blue-700 focus-within:bg-white">
                      <span className="block text-[10px] font-black uppercase tracking-wide text-slate-500">Du</span>
                      <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="w-full bg-transparent text-sm font-black text-slate-800 outline-none" />
                    </label>
                    <label className="h-12 border border-slate-200 bg-slate-50 px-3 py-1 focus-within:border-blue-700 focus-within:bg-white">
                      <span className="block text-[10px] font-black uppercase tracking-wide text-slate-500">Au</span>
                      <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="w-full bg-transparent text-sm font-black text-slate-800 outline-none" />
                    </label>
                    {statusOptions.length ? (
                      <label className="h-12 border border-slate-200 bg-slate-50 px-3 py-1 focus-within:border-blue-700 focus-within:bg-white">
                        <span className="block text-[10px] font-black uppercase tracking-wide text-slate-500">Statut</span>
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full bg-transparent text-sm font-black text-slate-800 outline-none">
                          <option value="">Tous</option>
                          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </label>
                    ) : null}
                    <button onClick={() => { setQuery(""); setDebouncedQuery(""); setFromDate(""); setToDate(""); setStatusFilter(""); }} className="h-12 border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50">Effacer</button>
                  </div>}
                </div>
                {!canAccessSelected ? <div className="p-8 text-sm font-semibold text-amber-800">{hospitalUi(locale, "moduleNotAssigned")}</div> : isDashboard ? <DepartmentDashboard loading={loading} data={rows[0] ?? {}} columns={selected.columns} locale={locale} /> : isAppointmentsCalendar ? <AppointmentsCalendarView rows={filtered} loading={loading} onRefresh={load} onCreate={openCreate} locale={locale} /> : <div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px]">
                    <thead className="bg-slate-50">
                      <tr>{selected.columns.map((column) => <th key={column.key} className="border-b border-slate-200 px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">{column.label}</th>)}<th className="border-b border-slate-200 px-5 py-4 text-right text-xs font-black uppercase tracking-wide text-slate-500">{hospitalUi(locale, "actions")}</th></tr>
                    </thead>
                    <tbody>
                      {loading ? <tr><td colSpan={selected.columns.length + 1} className="px-5 py-20 text-center text-sm font-semibold text-slate-500"><Loader2 className="mx-auto mb-3 size-6 animate-spin text-blue-700" />{hospitalUi(locale, "loadingData")}</td></tr> :
                      filtered.length ? filtered.map((row, index) => <tr key={row.id ?? index} className="border-t border-slate-100 hover:bg-slate-50">{selected.columns.map((column) => <td key={column.key} className="max-w-xs truncate px-5 py-4 text-sm font-semibold text-slate-700">{safeCellText(displayCell(row, column.key, referenceLabels))}</td>)}<td className="px-5 py-4 text-right"><div className="inline-flex border border-slate-200"><button onClick={() => openView(row)} className="px-3 py-2 text-slate-600 hover:bg-slate-50" title="Voir"><Eye className="size-4" /></button>{canUpdateSelected && <button onClick={() => openEdit(row)} className="border-l border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50" title="Modifier"><Edit3 className="size-4" /></button>}{canPrintSelected && <button onClick={() => setPrintDialog({ row })} className="border-l border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50" title="Documents"><Printer className="size-4" /></button>}{getRowActions(selected.endpoint, row).filter((action) => canRunOperation(action.kind, canCreateSelected, canUpdateSelected, canPrintSelected)).map((action) => <button key={action.label} onClick={() => action.kind === "print-invoice" ? setPrintDialog({ row }) : action.kind === "download-backup" ? downloadBackup(row) : action.kind === "patient-record" ? router.push(`/${locale}/hospital/patients/${row.patientId}`) : action.kind === "close-queue" ? closeQueueEncounter(row) : openOperation(action.kind, row)} className="border-l border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50" title={action.label}><action.icon className="size-4" /></button>)}</div></td></tr>) :
                      <tr><td colSpan={selected.columns.length + 1} className="px-5 py-20 text-center"><Database className="mx-auto mb-3 size-8 text-slate-300" /><p className="font-black text-slate-800">{hospitalUi(locale, "noData")}</p><p className="mt-1 text-sm text-slate-500">{hospitalUi(locale, "noDataHint")}</p></td></tr>}
                    </tbody>
                    </table>
                  </div>
                  <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm font-semibold text-slate-500">
                      {totalRows ? `${((page - 1) * pageSize) + 1}-${Math.min(page * pageSize, totalRows)} sur ${totalRows}` : `${filtered.length} ligne${filtered.length > 1 ? "s" : ""}`}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="h-10 border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 outline-none focus:border-blue-700">
                        {[25, 50, 100, 200].map((size) => <option key={size} value={size}>{size} / page</option>)}
                      </select>
                      <button disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="h-10 border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Précédent</button>
                      <span className="h-10 border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700">Page {page} / {pageCount}</span>
                      <button disabled={page >= pageCount || loading || !filtered.length} onClick={() => setPage((current) => current + 1)} className="h-10 border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Suivant</button>
                    </div>
                  </div>
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
              data={printDialog.row ? undefined : printPayloadData(selected.title, rows)}
              onClose={() => setPrintDialog(null)}
            />
          )}

          {missingPricing && (
            <MissingPricingDialog
              state={missingPricing}
              posting={posting}
              locale={locale}
              onChange={setMissingPricing}
              onClose={() => setMissingPricing(null)}
              onSubmit={completeMissingPricing}
            />
          )}

          {viewRow && (
            <RecordDetailsDrawer
              title={selected.title}
              row={viewRow}
              columns={selected.columns}
              referenceLabels={referenceLabels}
              onClose={() => setViewRow(null)}
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

function resourceQueryParams(endpoint: string, search: string, from: string, to: string, status: string, page: number, limit: number) {
  return cleanObject({
    page: endpoint === "/appointments" ? 1 : page,
    limit: endpoint === "/appointments" ? 100 : limit,
    search: search || undefined,
    from: from || undefined,
    to: to || undefined,
    status: status || undefined,
  });
}

function readTotalRows(responseData: any, fallback: number) {
  const candidates = [responseData?.total, responseData?.totalItems, responseData?.meta?.total, responseData?.pagination?.total, responseData?.count];
  const value = candidates.map((item) => Number(item)).find((item) => Number.isFinite(item) && item >= 0);
  return value ?? fallback;
}

async function parseWhoGrowthFile(file: File) {
  const lower = file.name.toLowerCase();
  const rows = lower.endsWith(".xlsx") || lower.endsWith(".xls") ? await parseWhoXlsx(file) : await parseWhoText(file);
  return enrichWhoRows(rows, file.name);
}

async function parseWhoXlsx(file: File) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true }) as unknown[][];
  return whoMatrixToRows(matrix);
}

async function parseWhoText(file: File) {
  const text = (await file.text()).replace(/^\uFEFF/, "").trim();
  if (!text) return [];
  if (file.name.toLowerCase().endsWith(".json") || text.startsWith("[")) {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("Le fichier JSON doit contenir un tableau de lignes OMS.");
    return parsed;
  }
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const delimiter = detectWhoDelimiter(lines[0]);
  return whoMatrixToRows(lines.map((line) => splitWhoLine(line, delimiter)));
}

function whoMatrixToRows(matrix: unknown[][]) {
  const headerIndex = matrix.findIndex((row) => {
    const keys = row.map((cell) => normalizeWhoKey(cell));
    return keys.includes("l") && keys.includes("m") && keys.includes("s") && keys.some((key) => ["month", "months", "week", "weeks", "length", "height", "day", "days"].includes(key));
  });
  if (headerIndex < 0) throw new Error("Colonnes OMS introuvables: le fichier doit contenir L, M, S et Month/Length/Height.");
  const headers = matrix[headerIndex].map((cell) => String(cell ?? "").trim());
  return matrix.slice(headerIndex + 1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))).filter((row) => {
    const normalized = normalizeWhoRecord(row);
    return Number.isFinite(Number(pickWhoValue(normalized, ["l"]))) && Number.isFinite(Number(pickWhoValue(normalized, ["m"]))) && Number.isFinite(Number(pickWhoValue(normalized, ["s"])));
  });
}

function enrichWhoRows(rows: Record<string, unknown>[], fileName: string) {
  const inferred = inferWhoFile(fileName);
  return rows.map((row) => {
    const normalized = normalizeWhoRecord(row);
    const standard = String(pickWhoValue(normalized, ["standard", "indicator"]) ?? inferred.standard ?? "").toUpperCase();
    const sex = normalizeWhoSex(pickWhoValue(normalized, ["sex", "gender"]) ?? inferred.sex);
    const xUnit = String(pickWhoValue(normalized, ["xunit", "unit"]) ?? inferred.xUnit ?? "").toUpperCase();
    const xValue = inferWhoXValue(normalized, xUnit);
    return {
      standard,
      sex,
      xUnit,
      xValue,
      l: pickWhoValue(normalized, ["l"]),
      m: pickWhoValue(normalized, ["m"]),
      s: pickWhoValue(normalized, ["s"]),
      source: "WHO",
      sourceVersion: "WHO Child Growth Standards",
      metadata: { importedFrom: fileName },
    };
  }).filter((row) => row.standard && row.sex && row.xUnit && Number.isFinite(Number(row.xValue)));
}

function inferWhoFile(fileName: string) {
  const lower = fileName.toLowerCase();
  const sex = lower.includes("girl") || lower.includes("female") ? "F" : lower.includes("boy") || lower.includes("male") ? "M" : "";
  if (lower.includes("wfa")) return { standard: "WFA", sex, xUnit: "AGE_DAYS" };
  if (lower.includes("lhfa") || lower.includes("hfa")) return { standard: "HFA", sex, xUnit: "AGE_DAYS" };
  if (lower.includes("bfa") || lower.includes("bmi")) return { standard: "BFA", sex, xUnit: "AGE_DAYS" };
  if (lower.includes("hcfa") || lower.includes("head")) return { standard: "HCFA", sex, xUnit: "AGE_DAYS" };
  if (lower.includes("wfl")) return { standard: "WFL", sex, xUnit: "LENGTH_CM" };
  if (lower.includes("wfh")) return { standard: "WFH", sex, xUnit: "HEIGHT_CM" };
  return { standard: "", sex, xUnit: "" };
}

function inferWhoXValue(row: Record<string, unknown>, xUnit: string) {
  if (xUnit === "AGE_DAYS") {
    const days = pickWhoValue(row, ["xvalue", "x", "day", "days", "agedays", "ageindays"]);
    if (days !== undefined) return Number(days);
    const weeks = pickWhoValue(row, ["week", "weeks"]);
    if (weeks !== undefined) return Math.round(Number(weeks) * 7);
    const months = pickWhoValue(row, ["month", "months"]);
    if (months !== undefined) return Math.round(Number(months) * 30.4375);
  }
  return Number(pickWhoValue(row, ["xvalue", "x", "length", "height", "cm"]));
}

function normalizeWhoRecord(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeWhoKey(key), value]));
}

function normalizeWhoKey(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pickWhoValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return undefined;
}

function normalizeWhoSex(value: unknown) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (["1", "M", "MALE", "BOY", "BOYS", "GARCON", "GARÇON"].includes(normalized)) return "M";
  if (["2", "F", "FEMALE", "GIRL", "GIRLS", "FILLE"].includes(normalized)) return "F";
  return normalized;
}

function detectWhoDelimiter(header: string) {
  return ["\t", ";", ","].sort((a, b) => header.split(b).length - header.split(a).length)[0];
}

function splitWhoLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function printPayloadData(moduleTitle: string, rows: any[]) {
  if (rows.length === 1 && rows[0] && typeof rows[0] === "object" && !Array.isArray(rows[0])) return { title: moduleTitle, ...rows[0] };
  return { title: moduleTitle, rows, rowsCount: rows.length };
}

function MissingPricingDialog({ state, posting, locale, onChange, onClose, onSubmit }: { state: MissingPricingState; posting: boolean; locale: string; onChange: (state: MissingPricingState) => void; onClose: () => void; onSubmit: () => void }) {
  const updateRow = (index: number, patch: Partial<MissingPricingRow>) => onChange({ ...state, rows: state.rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row) });
  const total = state.rows.reduce((sum, row) => sum + Number(row.unitPrice || 0) * Math.max(1, Number(row.count || 1)), 0);

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/50">
      <div className="ml-auto h-full w-full max-w-4xl overflow-y-auto border-l border-slate-300 bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-7 py-5">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center bg-blue-700 text-white"><BadgeDollarSign className="size-6" /></span>
            <div>
              <h2 className="text-2xl font-black text-slate-950">Compléter les tarifs manquants</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Créer une grille complémentaire puis relancer la facture.</p>
            </div>
          </div>
          <button onClick={onClose} className="border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"><X className="size-5" /></button>
        </div>

        <div className="space-y-5 p-7">
          <div className="grid gap-4 border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Nom de grille</span>
              <input value={state.name} onChange={(event) => onChange({ ...state, name: event.target.value })} className="w-full border border-slate-200 bg-white px-3 py-3 text-sm font-black outline-none focus:border-blue-700" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Devise</span>
              <select value={state.currency} onChange={(event) => onChange({ ...state, currency: event.target.value })} className="w-full border border-slate-200 bg-white px-3 py-3 text-sm font-black outline-none focus:border-blue-700">
                {["USD", "CDF", "RWF", "EUR"].map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Valable à partir du</span>
              <input type="date" value={state.validFrom} onChange={(event) => onChange({ ...state, validFrom: event.target.value })} className="w-full border border-slate-200 bg-white px-3 py-3 text-sm font-black outline-none focus:border-blue-700" />
            </label>
          </div>

          <div className="overflow-hidden border border-slate-200 bg-white">
            <div className="grid grid-cols-[minmax(220px,1.4fr)_90px_150px_150px] gap-3 border-b border-slate-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">
              <span>Prestation</span><span>Qté</span><span>Prix patient</span><span>Prix assurance</span>
            </div>
            <div className="divide-y divide-slate-100">
              {state.rows.map((row, index) => (
                <div key={row.serviceCode} className="grid grid-cols-[minmax(220px,1.4fr)_90px_150px_150px] gap-3 p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-slate-950 px-2 py-1 text-[11px] font-black text-white">{row.serviceCode}</span>
                      <span className="text-sm font-black text-slate-950">{cleanMissingDescription(row.description, row.serviceCode)}</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{row.serviceCode === "BED_NIGHT" ? "Prix d’une nuit. La quantité correspond au nombre de nuits." : "Prix unitaire appliqué à chaque ligne détectée."}</p>
                  </div>
                  <div className="flex h-12 items-center border border-slate-100 bg-slate-50 px-3 text-sm font-black text-slate-700">{row.count}</div>
                  <input type="number" min="0" step="0.01" value={row.unitPrice} onChange={(event) => updateRow(index, { unitPrice: event.target.value })} placeholder="ex. 25" className="h-12 border border-slate-200 bg-slate-50 px-3 text-sm font-black outline-none focus:border-blue-700 focus:bg-white" />
                  <input type="number" min="0" step="0.01" value={row.insurancePrice} onChange={(event) => updateRow(index, { insurancePrice: event.target.value })} placeholder="Optionnel" className="h-12 border border-slate-200 bg-slate-50 px-3 text-sm font-black outline-none focus:border-blue-700 focus:bg-white" />
                </div>
              ))}
            </div>
            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-900">
              Total estimé: {total.toLocaleString(locale === "en" ? "en-US" : "fr-FR", { maximumFractionDigits: 2 })} {state.currency}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button onClick={onClose} className="h-12 border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 hover:bg-slate-50">Annuler</button>
            <button disabled={posting} onClick={onSubmit} className="inline-flex h-12 items-center justify-center gap-2 bg-blue-700 px-6 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50">
              {posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Créer les tarifs et facturer
            </button>
          </div>
        </div>
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

function buildMissingPricingState(services: any[], operationForm: Record<string, any>): MissingPricingState {
  const rows = normalizeRows(services).map((service) => ({
    serviceCode: String(service.serviceCode ?? "").trim().toUpperCase(),
    description: String(service.description ?? service.serviceCode ?? ""),
    count: Math.max(1, Number(service.count ?? 1)),
    unitPrice: "",
    insurancePrice: "",
  })).filter((service) => service.serviceCode);
  const validFrom = String(operationForm.from ?? "").slice(0, 10) || new Date().toISOString().slice(0, 10);
  return {
    name: `Tarifs manquants ${new Date().toISOString().slice(0, 10)}`,
    currency: "USD",
    validFrom,
    rows,
  };
}

async function ensurePricingServices(rows: MissingPricingRow[]) {
  const response = await api.get("/pricing/services", { params: { limit: 1000 } });
  const existing = normalizeRows(response.data).map((service) => ({ id: String(service.id ?? ""), code: String(service.code ?? "").toUpperCase() }));
  const byCode = new Map(existing.filter((service) => service.id && service.code).map((service) => [service.code, service]));

  for (const row of rows) {
    if (byCode.has(row.serviceCode)) continue;
    const created = await api.post("/pricing/services", servicePayload(row));
    const service = { id: String(created.data?.id ?? ""), code: row.serviceCode };
    if (service.id) byCode.set(row.serviceCode, service);
  }

  return Array.from(byCode.values());
}

function servicePayload(row: MissingPricingRow) {
  const code = row.serviceCode;
  const isNight = code === "BED_NIGHT";
  const isConsultation = code.startsWith("CON") || code.includes("CONSULT");
  const isEmergency = code.startsWith("TRI") || code.includes("EMERGENCY");
  return {
    code,
    name: cleanMissingDescription(row.description, code),
    category: isNight ? "HOSPITALISATION" : isConsultation ? "CONSULTATION" : isEmergency ? "URGENCE" : "AUTRE",
    unit: isNight ? "NIGHT" : "ACT",
    sourceModule: isNight ? "admissions" : isConsultation ? "consultations" : isEmergency ? "emergency" : "billing",
    sourceEvent: code,
  };
}

function cleanMissingDescription(description: string, code: string) {
  const cleaned = String(description || "").replace(/^Tarif manquant:\s*/i, "").trim();
  if (!cleaned || cleaned === code) {
    if (code === "BED_NIGHT") return "Nuit d’hospitalisation";
    if (code === "CON-001") return "Consultation générale";
    if (code === "TRI-002") return "Triage / traitement";
  }
  return cleaned || code;
}

function displayCell(row: any, key: string, referenceLabels: Record<string, Record<string, string>>) {
  if (key === "id") return recordReference(row);
  if (key === "patientId" && row?.patientName) return [row.patientName, row.medicalRecordNumber].filter(Boolean).join(" · ");
  if (key === "practitionerId" && row?.practitionerName) return row.practitionerName;
  if (key === "prescriberId" && row?.prescriberName) return row.prescriberName;
  if (key === "attendingPractitionerId" && row?.attendingPractitionerName) return row.attendingPractitionerName;
  const value = row?.[key];
  if (key === "percentiles") return whoDecisionText(value);
  const mapped = value !== undefined && value !== null ? referenceLabels[key]?.[String(value)] : undefined;
  if (mapped) return mapped;
  const readableSibling = readableSiblingValue(row, key);
  if (readableSibling) return formatValue(readableSibling);
  if (isUuid(value)) return "Référence interne";
  return formatValue(value);
}

function recordReference(row: any) {
  const keys = ["displayReference", "invoiceNumber", "medicalRecordNumber", "employeeNumber", "badgeNumber", "orderNumber", "ticketNumber", "entryNumber", "contractNumber", "runNumber", "code", "sku", "batchNumber", "donorNumber", "bagNumber", "barcode", "name", "title", "chiefComplaint", "procedure", "status"];
  const value = keys.map((key) => row?.[key]).find((item) => item !== undefined && item !== null && item !== "");
  if (value) return formatValue(value);
  const id = String(row?.id ?? "").replace(/-/g, "").slice(0, 8).toUpperCase();
  return id ? `REF-${new Date().getFullYear()}-${id}` : "Référence interne";
}

function referenceRowLabel(row: Record<string, any>, keys: string[]) {
  const label = relationLabel(row, keys);
  return label === "Référence sans nom" || isUuid(label) ? recordReference(row) : label;
}

function safeCellText(value: any) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return formatValue(value);
}

function whoDecisionText(value: any) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return formatValue(value);
  const summary = value.whoSummary;
  const alerts = Array.isArray(value.whoAlerts) ? value.whoAlerts : [];
  const who = value.who && typeof value.who === "object" ? value.who : null;
  const indicators = who?.indicators && typeof who.indicators === "object" ? Object.values(who.indicators as Record<string, any>) : [];
  const severity = String(summary?.severity ?? (alerts.some((alert: any) => alert?.severity === "CRITICAL") ? "CRITICAL" : alerts.some((alert: any) => alert?.severity === "WARNING") ? "WARNING" : indicators.length ? "NORMAL" : "")).toUpperCase();
  const label = severity === "CRITICAL" ? "Critique" : severity === "WARNING" ? "À surveiller" : severity === "NORMAL" ? "Normal" : "Décision non calculée";
  const decision = summary?.decision || (severity === "CRITICAL" ? "Alerte critique OMS: évaluation médicale urgente recommandée." : severity === "WARNING" ? "Surveillance OMS: contrôle clinique recommandé." : severity === "NORMAL" ? "Croissance compatible avec les standards OMS." : "Saisissez une mesure complète et chargez le référentiel OMS.");
  const zScores = indicators.slice(0, 3).map((indicator: any) => `${indicator.label}: Z ${Number(indicator.zScore) >= 0 ? "+" : ""}${indicator.zScore}`).join(" · ");
  return [label, decision, zScores].filter(Boolean).join(" · ");
}


function RecordDetailsDrawer({ title, row, columns, referenceLabels, onClose }: { title: string; row: any; columns: { key: string; label: string }[]; referenceLabels: Record<string, Record<string, string>>; onClose: () => void }) {
  const labels = new Map(columns.map((column) => [column.key, column.label]));
  const keys = Array.from(new Set([
    ...columns.map((column) => column.key).filter((key) => !isTechnicalDetailKey(key)),
    ...Object.keys(row ?? {}).filter((key) => !isTechnicalDetailKey(key)),
  ])).filter((key) => !isTechnicalDetailKey(key));

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/40">
      <div className="ml-auto h-full w-full max-w-4xl overflow-y-auto border-l border-slate-300 bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-7 py-5">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Détails</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{title} · {recordReference(row)}</p>
          </div>
          <button onClick={onClose} className="border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"><X className="size-5" /></button>
        </div>

        <div className="grid gap-4 p-7 md:grid-cols-2">
          {keys.map((key) => {
            const value = key in row ? row[key] : undefined;
            if (value === undefined || value === null || value === "") return null;
            return (
              <section key={key} className={detailWide(value) ? "md:col-span-2" : ""}>
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">{labels.get(key) ?? detailLabel(key)}</p>
                <DetailValue value={displayDetailValue(row, key, referenceLabels)} />
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DetailValue({ value }: { value: any }) {
  if (Array.isArray(value) && value.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
    const columns = Array.from(new Set(value.flatMap((item) => Object.keys(item).filter((key) => !isTechnicalDetailKey(key))))).slice(0, 6);
    return (
      <div className="overflow-x-auto border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500"><tr>{columns.map((column) => <th key={column} className="px-3 py-2">{detailLabel(column)}</th>)}</tr></thead>
          <tbody>{value.map((item, index) => <tr key={index} className="border-t border-slate-100">{columns.map((column) => <td key={column} className="px-3 py-3 font-semibold text-slate-700">{formatDetailCell(item[column])}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  }
  if (isFileAttachment(value)) return <FileAttachmentDetail file={value} />;
  if (value && typeof value === "object" && typeof value.content === "string") return <div className="min-h-16 border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-800" dangerouslySetInnerHTML={{ __html: value.content }} />;
  if (value && typeof value === "object") return <div className="min-h-16 border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-800">{objectDetailText(value)}</div>;
  return <div className="min-h-12 border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-800">{formatValue(value)}</div>;
}

function FileAttachmentDetail({ file }: { file: Record<string, any> }) {
  const url = String(file.url || file.secureUrl || "");
  const fileName = String(file.fileName || file.originalFilename || "Document médical");
  const contentType = String(file.contentType || file.mimeType || "Document");
  return (
    <div className="flex min-h-20 items-center justify-between gap-4 border border-slate-200 bg-slate-50 p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-900">{fileName}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{cleanContentType(contentType)} · {formatFileSize(file.size)}</p>
      </div>
      {url ? <a href={url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 border border-blue-700 bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800"><FileText className="size-4" />Ouvrir</a> : null}
    </div>
  );
}

function isFileAttachment(value: any) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && (value.url || value.secureUrl) && (value.fileName || value.contentType || value.provider === "cloudinary"));
}

function cleanContentType(value: string) {
  if (value === "application/pdf") return "PDF";
  if (value.startsWith("image/")) return "Image";
  return value || "Document";
}

function formatFileSize(value: any) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "taille non renseignée";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} Mo`;
}

const hiddenDetailKeys = new Set([
  "id",
  "organizationId",
  "organization_id",
  "deletedAt",
  "deleted_at",
  "passwordHash",
  "password_hash",
  "refreshTokenHash",
  "refresh_token_hash",
  "chargeId",
  "charge_id",
  "chargeIds",
  "charge_ids",
  "sampleChargeIds",
  "sample_charge_ids",
  "invoiceId",
  "invoice_id",
]);

function isTechnicalDetailKey(key: string) {
  return hiddenDetailKeys.has(key) || isTechnicalKey(key);
}

function displayDetailValue(row: any, key: string, referenceLabels: Record<string, Record<string, string>>) {
  const value = row?.[key];
  const cell = displayCell(row, key, referenceLabels);
  if (cell !== "-" && cell !== formatValue(value)) return cell;
  if (isUuid(value)) return "Référence interne";
  if (Array.isArray(value) && value.every((item) => isUuid(item))) return `${value.length} référence${value.length > 1 ? "s" : ""} interne${value.length > 1 ? "s" : ""}`;
  return value;
}

function objectDetailText(value: Record<string, any>) {
  if (isFileAttachment(value)) return [value.fileName || "Document médical", cleanContentType(String(value.contentType || "")), formatFileSize(value.size)].filter(Boolean).join(" · ");
  if (typeof value.content === "string") return value.content.replace(/<[^>]+>/g, "").trim() || "-";
  const text = Object.entries(value)
    .filter(([key, item]) => key !== "format" && !isTechnicalDetailKey(key) && item !== null && item !== undefined && item !== "")
    .map(([key, item]) => `${detailLabel(key)}: ${formatDetailCell(item)}`)
    .join(" · ");
  return text || "-";
}

function formatDetailCell(value: any) {
  if (isUuid(value)) return "-";
  if (Array.isArray(value) && value.every((item) => isUuid(item))) return `${value.length} référence${value.length > 1 ? "s" : ""} interne${value.length > 1 ? "s" : ""}`;
  return formatValue(value);
}

function readableSiblingValue(row: any, key: string) {
  const base = key.replace(/(_id|Id|Ids|_ids)$/g, "");
  const candidates = [
    `${base}Name`,
    `${base}_name`,
    `${base}Label`,
    `${base}_label`,
    `${base}Code`,
    `${base}_code`,
    key.replace(/Id$/, "Name"),
    key.replace(/_id$/, "_name"),
  ];
  return candidates.map((candidate) => row?.[candidate]).find((value) => value !== undefined && value !== null && value !== "" && !isUuid(value));
}

function referenceKeysForRows(columnKeys: string[], rows: any[]) {
  return Array.from(new Set([
    ...columnKeys,
    ...rows.flatMap((row) => Object.keys(row ?? {}).filter((key) => hospitalReferences[key] && row?.[key])),
  ]));
}

function detailWide(value: any) {
  return Array.isArray(value) || (value && typeof value === "object") || String(value ?? "").length > 80;
}

function detailLabel(key: string) {
  return key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
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
    ...(canPayInvoice(row) ? [{ kind: "pay-invoice" as const, label: "Encaisser", icon: CreditCard }] : []),
  ];
  const actions: OperationAction[] = [];
  if (endpoint === "/backups" && String(row?.status ?? "").toUpperCase() === "COMPLETED") actions.push({ kind: "download-backup", label: "Télécharger", icon: Download });
  if (row?.patientId && endpoint !== "/patients") actions.push({ kind: "patient-record", label: "Dossier patient", icon: UserRound });
  if (endpoint === "/pharmacy/dispensations" && row?.patientId && canBillDispensation(row)) actions.push({ kind: "generate-invoice", label: "Facturer / encaisser", icon: Receipt });
  if (endpoint === "/laboratory/results" && !row?.validatedAt) actions.push({ kind: "validate-lab", label: "Valider résultat", icon: CheckCircle2 });
  if (endpoint === "/consultations" && row?.status !== "COMPLETED") actions.push({ kind: "complete-consultation", label: "Terminer consultation", icon: CheckCircle2 });
  if (endpoint === "/maternity/pregnancy-records" && String(row?.status ?? "").toUpperCase() === "ACTIVE") {
    if (!row?.surgerySlotId && !row?.surgery_slot_id) actions.push({ kind: "send-to-surgery", label: "Envoyer au bloc", icon: Activity });
    actions.push({ kind: "confirm-birth", label: "Confirmer naissance", icon: Baby });
  }
  if (endpoint === "/surgery/slots" && !["COMPLETED", "CANCELLED"].includes(String(row?.status ?? "").toUpperCase())) actions.push({ kind: "surgery-status", label: "Statut salle", icon: Activity });
  if (endpoint === "/surgery/slots") actions.push({ kind: "validate-material-count", label: "Valider comptage", icon: CheckCircle2 });
  if (endpoint === "/surgery/checklists") actions.push({ kind: "validate-oms-step", label: "Valider OMS", icon: CheckCircle2 });
  if (endpoint === "/nursing/medications" && !["ADMINISTERED", "REFUSED", "PATIENT_ABSENT", "CANCELLED"].includes(String(row?.status ?? "").toUpperCase())) actions.push({ kind: "administer-medication", label: "Administrer", icon: Smartphone });
  if (endpoint === "/nursing/tasks" && !["DONE", "FAIT", "CANCELLED", "ANNULE"].includes(String(row?.status ?? "").toUpperCase())) actions.push({ kind: "complete-nursing-task", label: "Clôturer soin", icon: CheckCircle2 });
  if (endpoint === "/users" && row?.email) actions.push({ kind: "resend-user-invitation", label: "Renvoyer invitation", icon: Send });
  if (endpoint === "/admissions" && row?.status !== "DISCHARGED") actions.push({ kind: "discharge", label: "Sortie patient", icon: FileText });
  if ((endpoint === "/reception/check-in" || endpoint === "/reception/walk-in-ticket") && String(row?.status ?? "").toUpperCase() === "IN_PROGRESS") actions.push({ kind: "close-queue", label: "Clôturer le passage", icon: CheckCircle2 });
  if (row?.status && !["/nursing/medications", "/nursing/tasks"].includes(endpoint) && nextStatuses(endpoint, row.status).length) actions.push({ kind: "change-status", label: "Changer statut", icon: CheckCircle2 });
  return actions;
}

function canPayInvoice(row: any) {
  const status = String(row?.status ?? "").toUpperCase();
  if (["PAID", "VOID", "CANCELLED"].includes(status)) return false;
  return moneyNumber(row?.balanceDue ?? row?.balance_due) > 0;
}

function canBillDispensation(row: any) {
  const status = String(row?.invoiceStatus ?? row?.paymentStatus ?? "").toUpperCase();
  if (["PAID", "PAYÉ", "PAYEE", "PAYÉE"].includes(status)) return false;
  if (row?.invoiceId && moneyNumber(row?.balanceDue ?? row?.balance_due) <= 0) return false;
  return true;
}

function moneyNumber(value: any) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value).replace(/\s/g, "").replace(",", ".");
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
}

function canRunOperation(kind: OperationKind, canCreate: boolean, canUpdate: boolean, canPrint: boolean) {
  if (kind === "print-invoice") return canPrint;
  if (kind === "download-backup") return true;
  if (kind === "preview-invoice" || kind === "generate-invoice") return true;
  if (kind === "stock-movement") return canCreate;
  if (kind === "patient-record") return true;
  if (kind === "close-queue") return true;
  if (kind === "confirm-birth") return canUpdate;
  if (kind === "send-to-surgery") return canUpdate;
  if (kind === "surgery-status" || kind === "validate-material-count" || kind === "validate-oms-step") return canUpdate;
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

function parseDownloadFileName(disposition: string) {
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] ? match[1].trim() : "";
}

async function downloadBackupFile(id: string, fallbackFileName?: string) {
  const response = await api.get(`/backups/${id}/download`, { responseType: "blob" });
  const disposition = String(response.headers?.["content-disposition"] || "");
  const fileName = parseDownloadFileName(disposition) || fallbackFileName || `sauvegarde-${id}.sql`;
  const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: "application/sql" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function waitForBackupCompletion(id: string) {
  if (!id) throw new Error("Sauvegarde non créée.");
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, attempt ? 2000 : 800));
    const response = await api.get("/backups", { params: { page: 1, limit: 50 } });
    const rows = Array.isArray(response.data?.data) ? response.data.data : [];
    const row = rows.find((item: any) => item.id === id);
    if (row?.status === "COMPLETED") return row;
    if (row?.status === "FAILED") throw new Error(row.errorMessage || "La sauvegarde a échoué.");
  }
  throw new Error("La sauvegarde prend trop de temps. Réessayez dans quelques secondes.");
}

async function readDownloadError(err: any) {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    const text = await data.text().catch(() => "");
    if (text) {
      try {
        const parsed = JSON.parse(text);
        const msg = parsed?.message ?? parsed?.detail ?? text;
        const message = Array.isArray(msg) ? msg.join(", ") : String(msg);
        const status = err?.response?.status;
        const method = err?.config?.method ? String(err.config.method).toUpperCase() : "";
        const url = err?.config?.url ? String(err.config.url) : "";
        const context = [status ? `HTTP ${status}` : "", method, url].filter(Boolean).join(" · ");
        return context ? `${context} — ${message}` : message;
      } catch {
        return text;
      }
    }
  }
  return readError(err);
}
