"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CalendarRange, CheckCircle2, CreditCard, Loader2, Pill, Plus, Receipt, Send, Trash2, UserRound, WalletCards, X } from "lucide-react";
import { hospitalText } from "@/shared/config/hospital-i18n";
import { api } from "@/shared/lib/http/api";
import type { OperationState } from "./types";
import { cleanObject, formatValue, isTechnicalKey, isUuid, nextStatuses, normalizeRows } from "./utils";
import { operationTitle } from "./operation-utils";
import { ReferenceField, SelectField, TextAreaField, TextField } from "./ResourceFields";

export function OperationDialog({ operation, form, setForm, posting, locale = "fr", onClose, onSubmit }: { operation: OperationState; form: Record<string, any>; setForm: (form: Record<string, any>) => void; posting: boolean; locale?: string; onClose: () => void; onSubmit: () => void }) {
  const title = hospitalText(operationTitle(operation.kind), locale);
  const isInvoiceFlow = operation.kind === "preview-invoice" || operation.kind === "generate-invoice";
  const isPharmacySale = isInvoiceFlow && form.sourceType === "DISPENSATION" && form.sourceId;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/40">
      <div className={`ml-auto h-full w-full overflow-y-auto border-l border-slate-300 bg-white ${isInvoiceFlow ? "max-w-5xl" : "max-w-2xl"}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-7 py-5">
          <div>
            <h2 className="text-2xl font-black text-slate-950">{isPharmacySale ? "Vente pharmacie" : title}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{isPharmacySale ? "Médicaments délivrés, montant et encaissement" : isInvoiceFlow ? "Facturation patient, prestations et encaissement" : "Action métier sécurisée"}</p>
          </div>
          <button onClick={onClose} className="border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"><X className="size-5" /></button>
        </div>
        <div className="space-y-5 p-7">
          {isInvoiceFlow ? <InvoiceWorkflow operationKind={operation.kind} form={form} setForm={setForm} /> : null}
          {operation.kind === "pay-invoice" ? <>
            <div className="border border-slate-200 bg-slate-950 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-wide text-blue-200">Facture à encaisser</p>
              <p className="mt-2 text-2xl font-black">{formatMoney(Number(operation.row?.balanceDue ?? form.amount ?? 0), operation.row?.currency ?? "USD")}</p>
              <p className="mt-1 text-sm font-semibold text-slate-300">{operation.row?.invoiceNumber ?? "Facture"}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField type="number" label="Montant encaissé" value={form.amount} onChange={(value) => setForm({ ...form, amount: Number(value) })} />
              <SelectField label="Méthode" value={form.method} onChange={(value) => setForm({ ...form, method: value })} options={["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER"]} />
            </div>
            <TextField label="Référence paiement" value={form.reference} onChange={(value) => setForm({ ...form, reference: value })} />
          </> : null}
          {operation.kind === "discharge" ? <TextAreaField label="Résumé de sortie" value={form.summary} onChange={(value) => setForm({ ...form, summary: value })} /> : null}
          {operation.kind === "complete-consultation" ? <>
            <TextAreaField label="Évaluation / diagnostic" value={form.assessment} onChange={(value) => setForm({ ...form, assessment: value })} />
            <TextAreaField label="Plan de traitement" value={form.plan} onChange={(value) => setForm({ ...form, plan: value })} />
            <TextAreaField label="Notes finales" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
          </> : null}
          {operation.kind === "stock-movement" ? <>
            <ReferenceField referenceKey="stockItemId" label="Article stock" value={form.stockItemId} onChange={(value) => setForm({ ...form, stockItemId: value })} />
            <SelectField label="Type" value={form.type} onChange={(value) => setForm({ ...form, type: value })} options={["RECEIPT", "ISSUE", "TRANSFER", "ADJUSTMENT"]} />
            <TextField type="number" label="Quantité" value={form.quantity} onChange={(value) => setForm({ ...form, quantity: Number(value) })} />
            <TextField label="Référence" value={form.reference} onChange={(value) => setForm({ ...form, reference: value })} />
          </> : null}
          {operation.kind === "change-status" ? <>
            <div className="border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Statut actuel</p>
              <p className="mt-1 text-lg font-black text-slate-950">{operation.row?.status ?? "-"}</p>
            </div>
            <SelectField label="Nouveau statut" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={nextStatuses(operation.endpoint ?? "", operation.row?.status)} />
            {operation.endpoint === "/nursing/medications" && form.status === "ADMINISTERED" ? <TextField type="datetime-local" label="Administré le" value={form.administeredAt} onChange={(value) => setForm({ ...form, administeredAt: value })} /> : null}
            <TextAreaField label="Notes / justification" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
          </> : null}
          {operation.kind === "validate-lab" ? <p className="border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Confirmer la validation biologique de ce résultat. Cette action engage le validateur.</p> : null}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button onClick={onClose} className="h-12 border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 hover:bg-slate-50">Annuler</button>
            <button disabled={posting} onClick={onSubmit} className="inline-flex h-12 items-center justify-center gap-2 bg-blue-700 px-6 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50">{posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}{isPharmacySale ? "Valider la vente" : isInvoiceFlow ? operation.kind === "generate-invoice" ? "Générer la facture" : "Calculer l’aperçu" : "Confirmer"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceWorkflow({ operationKind, form, setForm }: { operationKind: string; form: Record<string, any>; setForm: (form: Record<string, any>) => void }) {
  const previewTotal = Number(form.preview?.subtotal ?? 0);
  const estimatedManualTotal = invoiceItemsTotal(form.invoiceItems);
  const displayTotal = previewTotal || estimatedManualTotal;
  const isPharmacyDispensation = form.sourceType === "DISPENSATION" && form.sourceId;
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    if (!isPharmacyDispensation || !form.patientId || form.preview) return;
    let mounted = true;
    setPreviewLoading(true);
    setPreviewError("");
    const { collectNow, paymentMethod, paymentAmount, paymentReference, preview, ...payload } = form;
    api.post("/billing/invoices/preview", cleanObject(payload))
      .then((response) => {
        if (!mounted) return;
        const total = Number(response.data?.subtotal ?? 0);
        setForm({
          ...form,
          preview: response.data,
          paymentAmount: form.paymentAmount || (total > 0 ? String(total) : ""),
        });
      })
      .catch((error) => mounted && setPreviewError(error?.response?.data?.message || error?.message || "Impossible de charger les médicaments délivrés."))
      .finally(() => mounted && setPreviewLoading(false));
    return () => { mounted = false; };
  }, [isPharmacyDispensation, form.patientId, form.sourceId]);

  if (isPharmacyDispensation) {
    return <PharmacySaleWorkflow operationKind={operationKind} form={form} setForm={setForm} previewLoading={previewLoading} previewError={previewError} />;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <InvoicePanel icon={<UserRound className="size-5" />} title="Patient et séjour" subtitle="Sélectionnez le dossier à facturer">
          <div className="grid gap-4 md:grid-cols-2">
            <ReferenceField referenceKey="patientId" label="Patient" value={form.patientId} onChange={(value) => setForm({ ...form, patientId: value })} />
            <ReferenceField referenceKey="admissionId" label="Admission" value={form.admissionId} onChange={(value) => setForm({ ...form, admissionId: value })} />
          </div>
        </InvoicePanel>

        <InvoicePanel icon={<Receipt className="size-5" />} title="Prestations facturées" subtitle="Ajoutez les actes à facturer ou laissez vide pour reprendre les frais déjà générés">
          <InvoiceItemsField value={form.invoiceItems} onChange={(value) => setForm({ ...form, invoiceItems: value })} />
        </InvoicePanel>

        {isPharmacyDispensation ? (
          <InvoicePanel icon={<Receipt className="size-5" />} title="Délivrance pharmacie" subtitle="La facture reprend uniquement les médicaments délivrés sur cette ordonnance">
            <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
              Les dates ne sont pas demandées pour la pharmacie: les lignes sont liées directement à la délivrance sélectionnée.
            </div>
          </InvoicePanel>
        ) : (
          <InvoicePanel icon={<CalendarRange className="size-5" />} title="Période de facturation" subtitle="Filtre optionnel pour limiter les frais repris">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField type="datetime-local" label="Du" value={form.from} onChange={(value) => setForm({ ...form, from: value })} />
              <TextField type="datetime-local" label="Au" value={form.to} onChange={(value) => setForm({ ...form, to: value })} />
            </div>
          </InvoicePanel>
        )}

        {form.preview ? <InvoicePreview value={form.preview} /> : null}
      </div>

      <aside className="space-y-5">
        <div className="border border-slate-200 bg-slate-950 p-5 text-white">
          <p className="text-xs font-black uppercase tracking-wide text-blue-200">Résumé caisse</p>
          <p className="mt-3 text-3xl font-black">{formatMoney(displayTotal, form.preview?.currency ?? "USD")}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-300">
            <span>Prestations</span><span className="text-right text-white">{Array.isArray(form.invoiceItems) ? form.invoiceItems.length : 0}</span>
            <span>Mode</span><span className="text-right text-white">{operationKind === "generate-invoice" ? "Création" : "Aperçu"}</span>
          </div>
        </div>

        {operationKind === "generate-invoice" ? (
          <div className="border border-blue-200 bg-blue-50 p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={Boolean(form.collectNow)} onChange={(event) => setForm({ ...form, collectNow: event.target.checked, paymentAmount: event.target.checked ? form.paymentAmount || String(displayTotal || "") : form.paymentAmount })} className="mt-1 size-4 rounded border-slate-300" />
              <span>
                <span className="flex items-center gap-2 text-sm font-black text-slate-950"><WalletCards className="size-4 text-blue-700" />Encaisser immédiatement</span>
                <span className="mt-1 block text-xs font-semibold text-slate-600">Cochez ici si le patient paie au moment de la création de la facture.</span>
              </span>
            </label>
            {form.collectNow ? (
              <div className="mt-4 space-y-4 border-t border-blue-100 pt-4">
                <TextField type="number" label="Montant encaissé" value={form.paymentAmount} onChange={(value) => setForm({ ...form, paymentAmount: Number(value) })} />
                <SelectField label="Méthode" value={form.paymentMethod} onChange={(value) => setForm({ ...form, paymentMethod: value })} options={["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER"]} />
                <TextField label="Référence paiement" value={form.paymentReference} onChange={(value) => setForm({ ...form, paymentReference: value })} />
                <div className="flex items-center gap-2 bg-white px-3 py-2 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="size-4" />La facture sera marquée payée à hauteur du montant encaissé.
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
            <CreditCard className="mb-3 size-5 text-slate-500" />
            Lancez l’aperçu pour vérifier les lignes et tarifs. L’encaissement apparaît au moment de générer la facture.
          </div>
        )}
      </aside>
    </div>
  );
}

function InvoicePanel({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="border border-slate-200 bg-white">
      <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
        <div className="flex size-10 items-center justify-center bg-blue-700 text-white">{icon}</div>
        <div>
          <h3 className="font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function PharmacySaleWorkflow({ operationKind, form, setForm, previewLoading, previewError }: { operationKind: string; form: Record<string, any>; setForm: (form: Record<string, any>) => void; previewLoading: boolean; previewError: string }) {
  const charges = normalizeRows(form.preview?.charges);
  const total = Number(form.preview?.subtotal ?? 0);
  const currency = form.preview?.currency ?? charges[0]?.currency ?? "USD";
  const itemCount = charges.reduce((sum, charge: any) => sum + Number(charge.quantity || 0), 0);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <section className="border border-slate-200 bg-white">
          <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div className="flex size-10 items-center justify-center bg-blue-700 text-white"><Pill className="size-5" /></div>
            <div>
              <h3 className="font-black text-slate-950">Médicaments vendus</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Lignes reprises depuis la délivrance sélectionnée.</p>
            </div>
          </div>

          <div className="p-5">
            {previewLoading ? (
              <div className="flex h-40 items-center justify-center border border-slate-200 bg-slate-50 text-sm font-bold text-slate-500">
                <Loader2 className="mr-2 size-5 animate-spin text-blue-700" />Chargement des médicaments délivrés...
              </div>
            ) : previewError ? (
              <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">{previewError}</div>
            ) : charges.length ? (
              <div className="border border-slate-200">
                <div className="hidden grid-cols-[minmax(0,1fr)_80px_130px_130px] bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 md:grid">
                  <span>Médicament</span>
                  <span className="text-right">Qté</span>
                  <span className="text-right">Prix unitaire</span>
                  <span className="text-right">Montant</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {charges.map((charge: any, index: number) => (
                    <div key={charge.id ?? index} className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[minmax(0,1fr)_80px_130px_130px] md:items-center">
                      <div className="min-w-0">
                        <p className="break-words font-black leading-5 text-slate-900">{charge.description ?? charge.serviceCode ?? "Médicament"}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3 md:block md:text-right">
                        <span className="text-xs font-black uppercase text-slate-400 md:hidden">Qté</span>
                        <span className="font-bold text-slate-700">{formatValue(charge.quantity)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 md:block md:text-right">
                        <span className="text-xs font-black uppercase text-slate-400 md:hidden">Prix unitaire</span>
                        <span className="font-bold text-slate-700">{formatMoney(Number(charge.unitPrice ?? 0), charge.currency ?? currency)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 md:block md:border-t-0 md:pt-0 md:text-right">
                        <span className="text-xs font-black uppercase text-slate-400 md:hidden">Montant</span>
                        <span className="font-black text-slate-950">{formatMoney(Number(charge.total ?? 0), charge.currency ?? currency)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">Aucun médicament facturable trouvé pour cette délivrance.</div>
            )}
          </div>
        </section>
      </div>

      <aside className="space-y-5">
        <div className="border border-slate-200 bg-slate-950 p-5 text-white">
          <p className="text-xs font-black uppercase tracking-wide text-blue-200">Total à payer</p>
          <p className="mt-3 text-4xl font-black">{formatMoney(total, currency)}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-300">
            <span>Lignes</span><span className="text-right text-white">{charges.length}</span>
            <span>Unités</span><span className="text-right text-white">{formatValue(itemCount)}</span>
            <span>Mode</span><span className="text-right text-white">{operationKind === "generate-invoice" ? "Vente" : "Aperçu"}</span>
          </div>
        </div>

        {operationKind === "generate-invoice" ? (
          <div className="border border-blue-200 bg-blue-50 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-950"><WalletCards className="size-4 text-blue-700" />Paiement pharmacie</div>
            <div className="space-y-4">
              <TextField type="number" label="Montant encaissé" value={form.paymentAmount} onChange={(value) => setForm({ ...form, paymentAmount: Number(value), collectNow: true })} />
              <SelectField label="Méthode" value={form.paymentMethod} onChange={(value) => setForm({ ...form, paymentMethod: value, collectNow: true })} options={["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER"]} />
              <TextField label="Référence paiement" value={form.paymentReference} onChange={(value) => setForm({ ...form, paymentReference: value, collectNow: true })} />
              <div className="flex items-center gap-2 bg-white px-3 py-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="size-4" />La vente sera facturée et encaissée en une seule action.
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function InvoicePreview({ value }: { value: any }) {
  const charges = normalizeRows(value?.charges);
  const unpriced = normalizeRows(value?.unpriced);
  return (
    <div className="border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Aperçu facture</p>
          <p className="mt-1 text-sm font-black text-slate-950">{formatValue(value?.subtotal)} {value?.currency ?? ""}</p>
        </div>
        {unpriced.length ? <span className="bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">Tarifs à compléter</span> : null}
      </div>
      <div className="divide-y divide-slate-100">
        {charges.slice(0, 12).map((charge: any, index: number) => (
          <div key={index} className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[1fr_90px_120px]">
            <div className="font-bold text-slate-800">{charge.description ?? charge.serviceCode ?? "Prestation"}</div>
            <div className="font-semibold text-slate-500">Qté {formatValue(charge.quantity)}</div>
            <div className="font-black text-slate-950 md:text-right">{formatValue(charge.total ?? charge.unitPrice)} {charge.currency ?? value?.currency ?? ""}</div>
          </div>
        ))}
        {!charges.length ? <p className="px-4 py-4 text-sm font-semibold text-slate-500">Aucune ligne à afficher.</p> : null}
      </div>
      {unpriced.length ? (
        <div className="border-t border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {unpriced.map((item: any) => cleanPreviewText(item.description ?? item.serviceCode)).join(" · ")}
        </div>
      ) : null}
    </div>
  );
}

function cleanPreviewText(value: any): string {
  if (isUuid(value)) return "Référence interne";
  if (Array.isArray(value)) return value.filter((item) => !isUuid(item)).map(cleanPreviewText).join(" · ");
  if (value && typeof value === "object") {
    return Object.entries(value).filter(([key]) => !isTechnicalKey(key)).map(([, item]) => cleanPreviewText(item)).filter(Boolean).join(" · ");
  }
  return formatValue(value);
}

function invoiceItemsTotal(value: any) {
  const rows = Array.isArray(value) ? value : [];
  return rows.reduce((sum, row) => sum + Number(row.quantity || 0) * Number(row.unitPrice || 0), 0);
}

function formatMoney(value: number, currency: string) {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0)} ${currency}`;
}

function InvoiceItemsField({ value, onChange }: { value: any; onChange: (value: any[]) => void }) {
  const rows = Array.isArray(value) ? value : [];
  const [services, setServices] = useState<Array<{ code: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get("/pricing/services")
      .then((response) => mounted && setServices(normalizeRows(response.data).map((service) => ({
        code: String(service.code ?? ""),
        label: [service.name, service.code, service.category].filter(Boolean).join(" · "),
      })).filter((service) => service.code)))
      .catch(() => mounted && setServices([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const updateRow = (index: number, patch: Record<string, any>) => onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  const addTariffRow = () => onChange([...rows, { serviceCode: "", quantity: 1, mode: "tariff" }]);
  const addManualRow = () => onChange([...rows, { serviceCode: "", description: "", quantity: 1, unitPrice: 0, mode: "manual" }]);
  const removeRow = (index: number) => onChange(rows.filter((_, rowIndex) => rowIndex !== index));

  return (
    <div className="overflow-hidden border border-slate-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Motifs facturables</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Utilisez la grille pour les prestations connues, ou une ligne libre pour un service exceptionnel.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addTariffRow} className="inline-flex items-center gap-2 border border-blue-700 bg-white px-3 py-2 text-xs font-black text-blue-800 hover:bg-blue-50"><Plus className="size-4" />Prestation tarifée</button>
          <button type="button" onClick={addManualRow} className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-100"><Plus className="size-4" />Ligne libre</button>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((row, index) => {
          const isManual = row.mode === "manual" || (!row.serviceCode && row.unitPrice !== undefined);
          return (
            <div key={index} className="grid gap-3 p-4 md:grid-cols-[1fr_90px_135px_42px]">
              <div className="space-y-2">
                <select
                  value={isManual ? "__manual__" : row.serviceCode ?? ""}
                  onChange={(event) => {
                    if (event.target.value === "__manual__") updateRow(index, { mode: "manual", serviceCode: "", description: row.description ?? "", unitPrice: row.unitPrice ?? 0 });
                    else updateRow(index, { mode: "tariff", serviceCode: event.target.value, description: "", unitPrice: undefined });
                  }}
                  className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-700 focus:bg-white"
                >
                  <option value="">{loading ? "Chargement..." : "Choisir une prestation tarifée"}</option>
                  {services.map((service) => <option key={service.code} value={service.code}>{service.label}</option>)}
                  <option value="__manual__">Service non configuré / ligne libre</option>
                </select>
                {isManual ? (
                  <input
                    value={row.description ?? ""}
                    onChange={(event) => updateRow(index, { description: event.target.value })}
                    placeholder="Libellé visible sur la facture"
                    className="h-11 w-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-700"
                  />
                ) : null}
              </div>
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">Qté</span>
                <input type="number" min="1" step="1" value={row.quantity ?? 1} onChange={(event) => updateRow(index, { quantity: Number(event.target.value) })} className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">Prix</span>
                {isManual ? (
                  <input type="number" min="0" step="0.01" value={row.unitPrice ?? 0} onChange={(event) => updateRow(index, { unitPrice: Number(event.target.value) })} className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white" />
                ) : (
                  <div className="flex h-11 items-center border border-slate-200 bg-slate-50 px-3 text-xs font-black uppercase tracking-wide text-slate-500">Grille</div>
                )}
              </label>
              <button type="button" onClick={() => removeRow(index)} className="mt-5 flex h-11 items-center justify-center border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="size-4" /></button>
            </div>
          );
        })}
        {!rows.length ? <p className="px-4 py-5 text-sm font-semibold text-slate-500">Aucun motif ajouté. La facture reprendra les frais déjà générés pour ce patient.</p> : null}
      </div>
    </div>
  );
}
