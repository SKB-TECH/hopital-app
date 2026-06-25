"use client";

import { Loader2, Send, X } from "lucide-react";
import { hospitalText } from "@/shared/config/hospital-i18n";
import type { OperationState } from "./types";
import { nextStatuses } from "./utils";
import { operationTitle } from "./operation-utils";
import { ReferenceField, SelectField, TextAreaField, TextField } from "./ResourceFields";

export function OperationDialog({ operation, form, setForm, posting, locale = "fr", onClose, onSubmit }: { operation: OperationState; form: Record<string, any>; setForm: (form: Record<string, any>) => void; posting: boolean; locale?: string; onClose: () => void; onSubmit: () => void }) {
  const title = hospitalText(operationTitle(operation.kind), locale);

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/40">
      <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto border-l border-slate-300 bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-7 py-5">
          <div><h2 className="text-2xl font-black text-slate-950">{title}</h2><p className="mt-1 text-sm font-semibold text-slate-500">Action métier sécurisée</p></div>
          <button onClick={onClose} className="border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"><X className="size-5" /></button>
        </div>
        <div className="space-y-5 p-7">
          {operation.kind === "preview-invoice" || operation.kind === "generate-invoice" ? <>
            <ReferenceField referenceKey="patientId" label="Patient" value={form.patientId} onChange={(value) => setForm({ ...form, patientId: value })} />
            <ReferenceField referenceKey="admissionId" label="Admission" value={form.admissionId} onChange={(value) => setForm({ ...form, admissionId: value })} />
            <TextField type="datetime-local" label="Du" value={form.from} onChange={(value) => setForm({ ...form, from: value })} />
            <TextField type="datetime-local" label="Au" value={form.to} onChange={(value) => setForm({ ...form, to: value })} />
            {form.preview && <pre className="max-h-80 overflow-auto border border-slate-200 bg-slate-50 p-4 text-xs">{JSON.stringify(form.preview, null, 2)}</pre>}
          </> : null}
          {operation.kind === "pay-invoice" ? <>
            <TextField type="number" label="Montant" value={form.amount} onChange={(value) => setForm({ ...form, amount: Number(value) })} />
            <SelectField label="Méthode" value={form.method} onChange={(value) => setForm({ ...form, method: value })} options={["CASH", "CARD", "MOBILE_MONEY", "BANK_TRANSFER"]} />
            <TextField label="Référence" value={form.reference} onChange={(value) => setForm({ ...form, reference: value })} />
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
            <button disabled={posting} onClick={onSubmit} className="inline-flex h-12 items-center justify-center gap-2 bg-blue-700 px-6 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50">{posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}Confirmer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
