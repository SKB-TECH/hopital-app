import type { HospitalField } from "@/shared/types/hospital.types";
import type { OperationKind } from "./types";

export function cleanObject(input: Record<string, any>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== "" && value !== undefined && value !== null && value !== "{}" && value !== "[]"));
}

export function normalizeRows(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return data && typeof data === "object" ? [data] : [];
}

export function defaultForm(fields: HospitalField[], row?: Record<string, any>) {
  return Object.fromEntries(fields.map((field) => [field.name, row?.[field.name] ?? (field.type === "json" ? "" : field.type === "number" ? 0 : field.type === "checkbox" ? false : field.type === "multiselect" ? [] : field.name === "active" ? "true" : "")]));
}

export function parseJsonPayload(value: string) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    throw new Error("Le JSON avancé est invalide. Corrigez la syntaxe avant d’enregistrer.");
  }
}

export function cleanPayload(form: Record<string, any>, fields: HospitalField[]) {
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

export function formatValue(value: any) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function readError(err: any) {
  const msg = err?.response?.data?.message ?? err?.response?.data?.detail ?? err?.message;
  return Array.isArray(msg) ? msg.join(", ") : String(msg || "Erreur inconnue");
}

export function relationLabel(row: Record<string, any>, keys: string[]) {
  return keys.map((key) => formatValue(row[key])).filter((value) => value && value !== "-").join(" · ") || row.id || "-";
}

export function defaultOperationForm(kind: OperationKind, row?: any, endpoint = "") {
  if (kind === "preview-invoice" || kind === "generate-invoice") return { patientId: row?.patientId ?? "", admissionId: row?.admissionId ?? "", from: "", to: "" };
  if (kind === "pay-invoice") return { amount: row?.balanceDue ?? "", method: "CASH", reference: "" };
  if (kind === "discharge") return { summary: "" };
  if (kind === "complete-consultation") return { assessment: row?.assessment ?? "", plan: row?.plan ?? "", notes: row?.notes ?? "" };
  if (kind === "stock-movement") return { stockItemId: row?.id ?? "", type: "RECEIPT", quantity: 1, reference: "" };
  if (kind === "change-status") return { status: nextStatuses(endpoint, row?.status)[0] ?? "", administeredAt: "", notes: "" };
  return {};
}

export function validateOperation(kind: OperationKind, form: Record<string, any>) {
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

export function nextStatuses(endpoint: string, current?: string) {
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
