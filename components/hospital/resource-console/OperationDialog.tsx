"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Activity, Baby, CalendarRange, CheckCircle2, CreditCard, Loader2, Pill, Plus, Receipt, Send, Trash2, UserRound, WalletCards, X } from "lucide-react";
import { hospitalText } from "@/shared/config/hospital-i18n";
import { api } from "@/shared/lib/http/api";
import type { OperationState } from "./types";
import { formatValue, invoiceApiPayload, isTechnicalKey, isUuid, nextStatuses, normalizeRows } from "./utils";
import { operationTitle } from "./operation-utils";
import { ReferenceField, SelectField, TextAreaField, TextField } from "./ResourceFields";

const PAYMENT_CURRENCIES = ["CDF", "USD", "EUR"];

export function OperationDialog({ operation, form, setForm, posting, locale = "fr", onClose, onSubmit }: { operation: OperationState; form: Record<string, any>; setForm: (form: Record<string, any>) => void; posting: boolean; locale?: string; onClose: () => void; onSubmit: () => void }) {
  const title = hospitalText(operationTitle(operation.kind), locale);
  const isInvoiceFlow = operation.kind === "preview-invoice" || operation.kind === "generate-invoice";
  const isPharmacySale = isInvoiceFlow && form.sourceType === "DISPENSATION" && form.sourceId;
  const isPharmacyPayment = operation.kind === "pay-invoice" && operation.endpoint === "/pharmacy/sales";
  const paymentDocumentNumber = operation.row?.invoiceNumber ?? operation.row?.saleNumber ?? operation.row?.documentNumber ?? "Document caisse";

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/40">
      <div className={`ml-auto h-full w-full overflow-x-hidden overflow-y-auto border-l border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 ${isInvoiceFlow ? "max-w-none" : "max-w-2xl"}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-7 py-5 dark:border-slate-700 dark:bg-slate-900">
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">{isPharmacySale ? "Vente pharmacie" : title}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">{isPharmacySale ? "Médicaments délivrés, montant et encaissement" : isInvoiceFlow ? "Facturation patient, prestations et encaissement" : "Action métier sécurisée"}</p>
          </div>
          <button onClick={onClose} className="border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"><X className="size-5" /></button>
        </div>
        <div className="space-y-5 p-4 sm:p-6 lg:p-7">
          {isInvoiceFlow ? <InvoiceWorkflow operationKind={operation.kind} form={form} setForm={setForm} /> : null}
          {operation.kind === "pay-invoice" ? <>
            <div className="border border-slate-200 bg-slate-950 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-wide text-blue-200">{isPharmacyPayment ? "Vente pharmacie à encaisser" : "Facture à encaisser"}</p>
              <p className="mt-2 text-2xl font-black">{formatMoney(Number(operation.row?.balanceDue ?? form.amount ?? 0), operation.row?.currency ?? "USD")}</p>
              <p className="mt-1 text-sm font-semibold text-slate-300">{paymentDocumentNumber}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <TextField type="number" label="Montant encaissé" value={form.amount} onChange={(value) => setForm({ ...form, amount: Number(value) })} />
              <SelectField label="Devise reçue" value={form.paymentCurrency ?? ""} onChange={(value) => setForm({ ...form, paymentCurrency: value })} options={PAYMENT_CURRENCIES} />
              <SelectField label="Méthode" value={form.method} onChange={(value) => setForm({ ...form, method: value })} options={["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER"]} />
            </div>
            <div className="border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-900 dark:border-slate-700 dark:bg-slate-950 dark:text-blue-100">
              La référence du reçu est générée automatiquement par la caisse. Pour carte ou mobile money, elle peut être ajoutée depuis le reçu opérateur si nécessaire.
            </div>
          </> : null}
          {operation.kind === "discharge" ? <TextAreaField label="Résumé de sortie" value={form.summary} onChange={(value) => setForm({ ...form, summary: value })} /> : null}
          {operation.kind === "complete-consultation" ? <>
            <TextAreaField label="Évaluation / diagnostic" value={form.assessment} onChange={(value) => setForm({ ...form, assessment: value })} />
            <TextAreaField label="Plan de traitement" value={form.plan} onChange={(value) => setForm({ ...form, plan: value })} />
            <TextAreaField label="Notes finales" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
          </> : null}
          {operation.kind === "confirm-birth" ? <BirthConfirmationWorkflow form={form} setForm={setForm} row={operation.row} /> : null}
          {operation.kind === "send-to-surgery" ? <SendToSurgeryWorkflow form={form} setForm={setForm} row={operation.row} /> : null}
          {operation.kind === "surgery-status" ? <>
            <div className="border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Intervention</p>
              <p className="mt-1 text-lg font-black text-slate-950">{operation.row?.procedureName ?? operation.row?.roomName ?? "Bloc opératoire"}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Statut actuel: {operation.row?.status ?? "-"}</p>
            </div>
            <SelectField label="Nouveau statut de salle" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={["INDUCTION", "INCISION", "SUTURE", "RECOVERY_ROOM", "CLEANING", "COMPLETED", "CANCELLED"]} />
            <p className="border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">Le passage à INCISION est bloqué tant que la check-list avant induction n’est pas validée. Le passage à COMPLETED est bloqué si le comptage matériel n’est pas conforme.</p>
          </> : null}
          {operation.kind === "validate-oms-step" ? <>
            <div className="border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-900">Validation nominative et horodatée de la check-list OMS. L’incision ne sera autorisée qu’après validation de l’induction.</div>
            <SelectField label="Étape OMS" value={form.step} onChange={(value) => setForm({ ...form, step: value })} options={["before-induction", "before-incision", "before-exit"]} />
          </> : null}
          {operation.kind === "validate-material-count" ? <p className="border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-900">Confirmer le comptage opératoire. Si une compresse, aiguille ou instrument manque, le système bloquera la clôture.</p> : null}
          {operation.kind === "administer-medication" ? <>
            <div className="border border-slate-200 bg-slate-950 p-4 text-white">
              <p className="text-xs font-black uppercase tracking-wide text-blue-200">Validation au lit du patient</p>
              <p className="mt-1 text-lg font-black">{operation.row?.medicine ?? "Médicament"}</p>
              <p className="mt-1 text-sm font-semibold text-slate-300">{operation.row?.dose ? `Dose: ${operation.row.dose}` : "Dose prescrite"} · {operation.row?.patientName ?? operation.row?.medicalRecordNumber ?? "Patient"}</p>
            </div>
            <TextField label="Code-barres scanné" value={form.scannedBarcode} onChange={(value) => setForm({ ...form, scannedBarcode: value })} />
            <TextField type="datetime-local" label="Administré le" value={form.administeredAt} onChange={(value) => setForm({ ...form, administeredAt: value })} />
            <TextAreaField label="Note infirmière" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
          </> : null}
          {operation.kind === "complete-nursing-task" ? <>
            <div className="border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Soin / tâche</p>
              <p className="mt-1 text-lg font-black text-slate-950">{operation.row?.description ?? operation.row?.type ?? "Tâche infirmière"}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Statut actuel: {operation.row?.status ?? "-"}</p>
            </div>
            <SelectField label="Nouveau statut" value={form.status} onChange={(value) => setForm({ ...form, status: value })} options={["DONE", "IN_PROGRESS", "POSTPONED", "CANCELLED"]} />
            <TextField type="datetime-local" label="Exécuté le" value={form.executedAt} onChange={(value) => setForm({ ...form, executedAt: value })} />
            <TextAreaField label="Transmission / note" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
          </> : null}
          {operation.kind === "resend-user-invitation" ? (
            <div className="border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
              Un nouveau mot de passe temporaire sera généré et envoyé uniquement à {operation.row?.email ?? "l’utilisateur"}. Il ne sera pas affiché à l’écran.
            </div>
          ) : null}
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
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
            <button onClick={onClose} className="h-12 border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">Annuler</button>
            <button disabled={posting} onClick={onSubmit} className="inline-flex h-12 items-center justify-center gap-2 bg-blue-700 px-6 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50">{posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}{isPharmacySale ? "Valider la vente" : isInvoiceFlow ? operation.kind === "generate-invoice" ? "Générer la facture" : "Calculer l’aperçu" : "Confirmer"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SendToSurgeryWorkflow({ form, setForm, row }: { form: Record<string, any>; setForm: (form: Record<string, any>) => void; row?: any }) {
  return (
    <div className="space-y-5">
      <section className="border border-slate-200 bg-slate-950 p-5 text-white">
        <div className="flex items-start gap-3">
          <div className="flex size-11 items-center justify-center bg-rose-600"><Activity className="size-5" /></div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-rose-100">Passerelle maternité → bloc opératoire</p>
            <h3 className="mt-1 text-xl font-black">Envoyer au bloc</h3>
            <p className="mt-1 text-sm font-semibold text-slate-300">{row?.patientName ?? "Patiente"} · {row?.medicalRecordNumber ?? "Dossier grossesse"}</p>
          </div>
        </div>
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <h3 className="font-black text-slate-950">Planification opératoire</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Le bloc recevra automatiquement l’intervention et la checklist OMS sera créée.</p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <ReferenceField referenceKey="operatingRoomId" label="Salle de bloc" value={form.operatingRoomId} onChange={(value) => setForm({ ...form, operatingRoomId: value })} />
          <ReferenceField referenceKey="surgeonId" label="Chirurgien / gynécologue" value={form.surgeonId} onChange={(value) => setForm({ ...form, surgeonId: value })} />
          <ReferenceField referenceKey="anesthesiologistId" label="Anesthésiste" value={form.anesthesiologistId} onChange={(value) => setForm({ ...form, anesthesiologistId: value })} />
          <SelectField label="Priorité" value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} options={["SCHEDULED", "URGENT", "EMERGENCY"]} />
          <TextField type="datetime-local" label="Début prévu" value={form.estimatedStartAt} onChange={(value) => setForm({ ...form, estimatedStartAt: value })} />
          <TextField type="datetime-local" label="Fin prévue" value={form.estimatedEndAt} onChange={(value) => setForm({ ...form, estimatedEndAt: value })} />
          <TextField label="Procédure" value={form.procedureName} onChange={(value) => setForm({ ...form, procedureName: value })} />
          <TextField label="Code procédure" value={form.procedureCode} onChange={(value) => setForm({ ...form, procedureCode: value })} />
        </div>
      </section>

      <TextAreaField label="Motif opératoire / contexte obstétrical" value={form.reason} onChange={(value) => setForm({ ...form, reason: value })} />

      <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-900">
        Cette action crée un créneau au bloc, relie le dossier grossesse à l’intervention et rend la patiente visible dans la tour de contrôle chirurgie.
      </div>
    </div>
  );
}

function BirthConfirmationWorkflow({ form, setForm, row }: { form: Record<string, any>; setForm: (form: Record<string, any>) => void; row?: any }) {
  return (
    <div className="space-y-5">
      <section className="border border-slate-200 bg-slate-950 p-5 text-white">
        <div className="flex items-start gap-3">
          <div className="flex size-11 items-center justify-center bg-blue-700"><Baby className="size-5" /></div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-200">Naissance et identitovigilance</p>
            <h3 className="mt-1 text-xl font-black">Confirmer la naissance</h3>
            <p className="mt-1 text-sm font-semibold text-slate-300">{row?.patientName ?? "Mère"} · {row?.medicalRecordNumber ?? "Dossier grossesse"}</p>
          </div>
        </div>
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <h3 className="font-black text-slate-950">Données de naissance</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Le système créera le dossier nouveau-né, le lien mère-enfant et le constat imprimable.</p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <TextField type="datetime-local" label="Date et heure naissance" value={form.deliveryAt} onChange={(value) => setForm({ ...form, deliveryAt: value })} />
          <SelectField label="Type de délivrance" value={form.deliveryType} onChange={(value) => setForm({ ...form, deliveryType: value })} options={["VAGINAL", "CESAREAN", "ASSISTED", "EMERGENCY_CESAREAN"]} />
          <TextField label="Prénom nouveau-né" value={form.firstName} onChange={(value) => setForm({ ...form, firstName: value })} />
          <TextField label="Nom nouveau-né" value={form.lastName} onChange={(value) => setForm({ ...form, lastName: value })} />
          <SelectField label="Sexe" value={form.gender} onChange={(value) => setForm({ ...form, gender: value })} options={["FEMALE", "MALE", "UNKNOWN"]} />
          <TextField type="number" label="Poids naissance g" value={form.birthWeightGrams} onChange={(value) => setForm({ ...form, birthWeightGrams: value })} />
        </div>
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <h3 className="font-black text-slate-950">Évaluation néonatale</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Apgar et pH cordon seront imprimés sur le constat.</p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-4">
          <TextField type="number" label="Apgar 1 min" value={form.apgar1} onChange={(value) => setForm({ ...form, apgar1: value })} />
          <TextField type="number" label="Apgar 5 min" value={form.apgar5} onChange={(value) => setForm({ ...form, apgar5: value })} />
          <TextField type="number" label="Apgar 10 min" value={form.apgar10} onChange={(value) => setForm({ ...form, apgar10: value })} />
          <TextField type="number" label="pH cordon" value={form.cordPh} onChange={(value) => setForm({ ...form, cordPh: value })} />
        </div>
      </section>

      <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
        Après confirmation, le dossier obstétrique sera verrouillé comme accouché et le constat de naissance sera imprimé automatiquement.
      </div>
    </div>
  );
}

function InvoiceWorkflow({ operationKind, form, setForm }: { operationKind: string; form: Record<string, any>; setForm: (form: Record<string, any>) => void }) {
  const previewTotal = Number(form.preview?.subtotal ?? 0);
  const estimatedManualTotal = invoiceItemsTotal(form.invoiceItems);
  const displayTotal = previewTotal || estimatedManualTotal;
  const displayCurrency = form.preview?.currency ?? invoiceItemsCurrency(form.invoiceItems) ?? "CDF";
  const isPharmacyDispensation = form.sourceType === "DISPENSATION" && form.sourceId;
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    if (!isPharmacyDispensation || !form.patientId || form.preview) return;
    let mounted = true;
    setPreviewLoading(true);
    setPreviewError("");
    api.post("/billing/invoices/preview", invoiceApiPayload(form))
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

  useEffect(() => {
    if (operationKind !== "generate-invoice" || !form.collectNow) return;
    if (displayTotal > 0 && Number(form.paymentAmount || 0) !== displayTotal) {
      setForm({ ...form, paymentAmount: String(displayTotal) });
    }
  }, [operationKind, form.collectNow, displayTotal]);

  useEffect(() => {
    if (isPharmacyDispensation || operationKind !== "generate-invoice" || !form.collectNow || !form.patientId || form.preview || estimatedManualTotal > 0) return;
    let mounted = true;
    setPreviewLoading(true);
    setPreviewError("");
    api.post("/billing/invoices/preview", invoiceApiPayload(form))
      .then((response) => {
        if (!mounted) return;
        const total = Number(response.data?.subtotal ?? 0);
        setForm({ ...form, preview: response.data, paymentAmount: form.paymentAmount || (total > 0 ? String(total) : "") });
      })
      .catch((error) => mounted && setPreviewError(error?.response?.data?.message || error?.message || "Impossible de calculer les frais à encaisser."))
      .finally(() => mounted && setPreviewLoading(false));
    return () => { mounted = false; };
  }, [isPharmacyDispensation, operationKind, form.collectNow, form.patientId, form.admissionId, form.from, form.to, estimatedManualTotal]);

  if (isPharmacyDispensation) {
    return <PharmacySaleWorkflow operationKind={operationKind} form={form} setForm={setForm} previewLoading={previewLoading} previewError={previewError} />;
  }

  return (
    <div className="grid w-full gap-5 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-5">
        <InvoicePanel icon={<UserRound className="size-5" />} title="Patient et séjour" subtitle="Sélectionnez le dossier à facturer">
          <div className="grid gap-4 md:grid-cols-2">
            <ReferenceField referenceKey="patientId" label="Patient" value={form.patientId} onChange={(value) => setForm({ ...form, patientId: value })} />
            <ReferenceField referenceKey="admissionId" label="Admission" value={form.admissionId} onChange={(value) => setForm({ ...form, admissionId: value })} />
          </div>
        </InvoicePanel>

        <InvoicePanel icon={<Receipt className="size-5" />} title="Prestations facturées" subtitle="Table de caisse, quantités, prix et total instantané">
          <InvoiceItemsField value={form.invoiceItems} onChange={(value) => setForm({ ...form, invoiceItems: value, preview: undefined })} currency={displayCurrency} />
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
          <p className="mt-3 text-3xl font-black">{formatMoney(displayTotal, displayCurrency)}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-300">
            <span>Prestations</span><span className="text-right text-white">{invoiceItemsCount(form.invoiceItems, form.preview)}</span>
            <span>Mode</span><span className="text-right text-white">{operationKind === "generate-invoice" ? "Création" : "Aperçu"}</span>
          </div>
        </div>

        {operationKind === "generate-invoice" ? (
          <div className="border border-blue-200 bg-blue-50 p-5 dark:border-slate-700 dark:bg-slate-950">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={Boolean(form.collectNow)} onChange={(event) => setForm({ ...form, collectNow: event.target.checked, paymentAmount: event.target.checked ? form.paymentAmount || (displayTotal > 0 ? String(displayTotal) : "") : form.paymentAmount })} className="mt-1 size-4 rounded border-slate-300" />
              <span>
                <span className="flex items-center gap-2 text-sm font-black text-slate-950 dark:text-white"><WalletCards className="size-4 text-blue-700 dark:text-blue-300" />Encaisser immédiatement</span>
                <span className="mt-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Le montant dû est repris automatiquement dès qu’il est calculé.</span>
              </span>
            </label>
            {form.collectNow ? (
              <div className="mt-4 space-y-4 border-t border-blue-100 pt-4 dark:border-slate-700">
                {previewLoading ? <div className="flex items-center gap-2 border border-blue-200 bg-white px-3 py-2 text-xs font-black text-blue-800 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-200"><Loader2 className="size-4 animate-spin" />Calcul du montant à encaisser...</div> : null}
                {previewError ? <div className="border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">{previewError}</div> : null}
                <TextField type="number" label="Montant à encaisser" value={form.paymentAmount} onChange={(value) => setForm({ ...form, paymentAmount: Number(value) })} />
                <SelectField label="Devise reçue" value={form.paymentCurrency ?? ""} onChange={(value) => setForm({ ...form, paymentCurrency: value })} options={PAYMENT_CURRENCIES} />
                <SelectField label="Méthode" value={form.paymentMethod} onChange={(value) => setForm({ ...form, paymentMethod: value })} options={["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER"]} />
                <div className="flex items-center gap-2 bg-white px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-slate-900 dark:text-emerald-300">
                  <CheckCircle2 className="size-4" />La référence caisse sera générée automatiquement au moment du paiement.
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
            <CreditCard className="mb-3 size-5 text-slate-500 dark:text-slate-300" />
            L’aperçu calcule les frais sans créer de facture. Utilisez-le pour vérifier les lignes avant validation.
          </div>
        )}
      </aside>
    </div>
  );
}

function InvoicePanel({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-950">
        <div className="flex size-10 items-center justify-center bg-blue-700 text-white">{icon}</div>
        <div>
          <h3 className="font-black text-slate-950 dark:text-white">{title}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-300">{subtitle}</p>
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
              <SelectField label="Devise reçue" value={form.paymentCurrency ?? ""} onChange={(value) => setForm({ ...form, paymentCurrency: value, collectNow: true })} options={PAYMENT_CURRENCIES} />
              <SelectField label="Méthode" value={form.paymentMethod} onChange={(value) => setForm({ ...form, paymentMethod: value, collectNow: true })} options={["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER"]} />
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
    <div className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-300">Aperçu facture</p>
          <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{formatValue(value?.subtotal)} {value?.currency ?? ""}</p>
        </div>
        {unpriced.length ? <span className="bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">Tarifs à compléter</span> : null}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {charges.slice(0, 12).map((charge: any, index: number) => (
          <div key={index} className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[1fr_90px_120px]">
            <div className="font-bold text-slate-800 dark:text-slate-100">{charge.description ?? charge.serviceCode ?? "Prestation"}</div>
            <div className="font-semibold text-slate-500 dark:text-slate-300">Qté {formatValue(charge.quantity)}</div>
            <div className="font-black text-slate-950 dark:text-white md:text-right">{formatValue(charge.total ?? charge.unitPrice)} {charge.currency ?? value?.currency ?? ""}</div>
          </div>
        ))}
        {!charges.length ? <p className="px-4 py-4 text-sm font-semibold text-slate-500 dark:text-slate-300">Aucune ligne à afficher.</p> : null}
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
  return rows.reduce((sum, row) => {
    const quantity = Number(row.quantity || 0);
    const unitPrice = Number(row.unitPrice ?? row.unit_price ?? 0);
    const amount = Number(row.amount ?? row.total ?? NaN);
    return sum + (Number.isFinite(amount) && amount > 0 ? amount : quantity * unitPrice);
  }, 0);
}

function invoiceItemsCurrency(value: any) {
  const rows = Array.isArray(value) ? value : [];
  return rows.map((row) => row?.currency).find(Boolean);
}

function invoiceItemsCount(value: any, preview: any) {
  const rows = Array.isArray(value) ? value.filter((row) => row?.serviceCode || row?.description) : [];
  if (rows.length) return rows.length;
  return normalizeRows(preview?.charges).length;
}

function formatMoney(value: number, currency: string) {
  const amount = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0).replace(/[\u202f\u00a0]/g, " ");
  return `${amount} ${currency}`;
}

function InvoiceItemsField({ value, onChange, currency }: { value: any; onChange: (value: any[]) => void; currency: string }) {
  const rows = Array.isArray(value) ? value : [];
  const [services, setServices] = useState<Array<{ code: string; label: string; name: string; category: string; unitPrice?: number; currency?: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get("/pricing/services")
      .then((response) => mounted && setServices(normalizeRows(response.data).map((service) => ({
        code: String(service.code ?? ""),
        name: String(service.name ?? service.code ?? ""),
        category: String(service.category ?? ""),
        unitPrice: service.unitPrice === null || service.unitPrice === undefined || service.unitPrice === "" ? undefined : Number(service.unitPrice),
        currency: service.currency ? String(service.currency) : undefined,
        label: [service.name, service.code].filter(Boolean).join(" · "),
      })).filter((service) => service.code)))
      .catch(() => mounted && setServices([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const serviceByCode = new Map(services.map((service) => [service.code, service]));

  useEffect(() => {
    if (!services.length || !rows.length) return;
    let changed = false;
    const hydrated = rows.map((row) => {
      if (row?.mode === "manual" || !row?.serviceCode) return row;
      const service = serviceByCode.get(String(row.serviceCode));
      if (!service || service.unitPrice === undefined) return row;
      if (Number(row.unitPrice ?? NaN) === service.unitPrice && row.currency === service.currency) return row;
      changed = true;
      return { ...row, unitPrice: service.unitPrice, currency: service.currency };
    });
    if (changed) onChange(hydrated);
  }, [services, rows]);

  const updateRow = (index: number, patch: Record<string, any>) => onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  const addTariffRow = () => onChange([...rows, { serviceCode: "", quantity: 1, mode: "tariff" }]);
  const addManualRow = () => onChange([...rows, { serviceCode: "", description: "", quantity: 1, unitPrice: 0, mode: "manual" }]);
  const removeRow = (index: number) => onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  const total = invoiceItemsTotal(rows);
  const missingPrices = rows.filter((row) => row?.mode !== "manual" && row?.serviceCode && Number(row.unitPrice ?? serviceByCode.get(String(row.serviceCode))?.unitPrice ?? 0) <= 0).length;

  return (
    <div className="overflow-hidden border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div className="flex items-baseline gap-3">
          <p className="text-sm font-black text-slate-950 dark:text-white">Panier de facturation</p>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-300">{rows.length ? `${rows.length} ligne(s)` : "Aucune ligne ajoutée"}</p>
        </div>
        {missingPrices ? <span className="border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">{missingPrices} tarif(s) à configurer</span> : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addTariffRow} className="inline-flex items-center gap-2 border border-blue-700 bg-white px-3 py-2 text-xs font-black text-blue-800 hover:bg-blue-50 dark:bg-slate-900 dark:text-blue-200 dark:hover:bg-slate-800"><Plus className="size-4" />Prestation tarifée</button>
          <button type="button" onClick={addManualRow} className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"><Plus className="size-4" />Ligne libre</button>
        </div>
      </div>
      {rows.length ? (
        <div className="hidden grid-cols-[minmax(420px,1fr)_96px_150px_170px_48px] border-b border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 lg:grid">
          <span>Prestation</span>
          <span className="text-right">Qté</span>
          <span className="text-right">Prix</span>
          <span className="text-right">Montant</span>
          <span />
        </div>
      ) : null}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map((row, index) => {
          const isManual = row.mode === "manual" || (!row.serviceCode && row.unitPrice !== undefined);
          const selectedService = serviceByCode.get(String(row.serviceCode ?? ""));
          const rowCurrency = row.currency ?? selectedService?.currency ?? currency;
          const unitPrice = Number(row.unitPrice ?? selectedService?.unitPrice ?? 0);
          const lineTotal = Number(row.quantity || 0) * unitPrice;
          return (
            <div key={index} className="grid gap-3 p-4 lg:grid-cols-[minmax(420px,1fr)_96px_150px_170px_48px] lg:items-start">
              <div className="space-y-2">
                <select
                  value={isManual ? "__manual__" : row.serviceCode ?? ""}
                  onChange={(event) => {
                    if (event.target.value === "__manual__") updateRow(index, { mode: "manual", serviceCode: "", description: row.description ?? "", unitPrice: row.unitPrice ?? 0 });
                    else {
                      const service = serviceByCode.get(event.target.value);
                      updateRow(index, {
                        mode: "tariff",
                        serviceCode: event.target.value,
                        description: "",
                        unitPrice: service?.unitPrice,
                        currency: service?.currency,
                      });
                    }
                  }}
                  className="h-11 w-full min-w-0 border border-slate-200 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:border-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400"
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
                    className="h-11 w-full min-w-0 border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400"
                  />
                ) : null}
              </div>
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-300 lg:hidden">Qté</span>
                <input type="number" min="1" step="1" value={row.quantity ?? 1} onChange={(event) => updateRow(index, { quantity: Number(event.target.value) })} className="h-11 w-full border border-slate-200 bg-white px-3 text-right text-sm font-black text-slate-950 outline-none focus:border-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-300 lg:hidden">Prix</span>
                {isManual ? (
                  <input type="number" min="0" step="0.01" value={row.unitPrice ?? 0} onChange={(event) => updateRow(index, { unitPrice: Number(event.target.value) })} className="h-11 w-full border border-slate-200 bg-white px-3 text-right text-sm font-black text-slate-950 outline-none focus:border-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400" />
                ) : (
                <div className={`flex h-11 items-center justify-end border px-3 text-sm font-black ${unitPrice > 0 ? "border-slate-200 bg-white text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white" : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"}`}>
                    {unitPrice > 0 ? formatMoney(unitPrice, rowCurrency) : "À tarifer"}
                  </div>
                )}
              </label>
              <div>
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-300 lg:hidden">Montant</span>
                <div className="flex h-11 items-center justify-end bg-slate-950 px-3 text-sm font-black text-white dark:bg-slate-800">{formatMoney(lineTotal, rowCurrency)}</div>
              </div>
              <button type="button" onClick={() => removeRow(index)} className="flex h-11 items-center justify-center border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-rose-950 dark:hover:text-rose-200"><Trash2 className="size-4" /></button>
            </div>
          );
        })}
        {!rows.length ? <p className="px-4 py-5 text-sm font-semibold text-slate-500 dark:text-slate-300">Aucun motif ajouté. La facture reprendra les frais déjà générés pour ce patient.</p> : null}
      </div>
      {rows.length ? (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-900">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-300">Total</span>
          <span className="text-xl font-black text-slate-950 dark:text-white">{formatMoney(total, currency)}</span>
        </div>
      ) : null}
    </div>
  );
}
