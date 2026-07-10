export function normalizeRows(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return data && typeof data === "object" ? [data] : [];
}

export function formatPatientValue(value: any): string {
  if (value === null || value === undefined || value === "") return "-";
  if (value instanceof Date) return formatDate(value);
  if (typeof value === "string" && isIsoDate(value)) return formatDate(new Date(value));
  if (Array.isArray(value)) return value.map(formatPatientValue).filter((item) => item !== "-").join(", ") || "-";
  if (typeof value === "object" && typeof value.content === "string") return stripHtml(value.content);
  if (typeof value === "object" && "content" in value && value.content) return formatPatientValue(value.content);
  if (typeof value === "object") return Object.entries(value).filter(([, item]) => item !== null && item !== undefined && item !== "").map(([key, item]) => `${labelPatientColumn(key)}: ${formatPatientValue(item)}`).join(" · ") || "-";
  return String(value);
}

export function isTechnicalPatientColumn(key: string) {
  return key === "id" || key === "organizationId" || key === "organization_id" || key === "deletedAt" || key === "deleted_at" || key.endsWith("Id") || key.endsWith("_id");
}

export function labelPatientColumn(key: string): string {
  const labels: Record<string, string> = {
    patientName: "Patient",
    medicalRecordNumber: "N° dossier",
    practitionerName: "Médecin",
    prescriberName: "Prescripteur",
    attendingPractitionerName: "Médecin traitant",
    chiefComplaint: "Motif",
    status: "Statut",
    createdAt: "Créé le",
    updatedAt: "Modifié le",
    startedAt: "Début",
    completedAt: "Fin",
    admittedAt: "Admission",
    dischargedAt: "Sortie",
    bedCode: "Lit",
    ward: "Service",
    room: "Chambre",
    items: "Détails",
    notes: "Notes",
    assessment: "Diagnostic",
    plan: "Plan",
    title: "Titre",
    type: "Type",
    invoiceNumber: "Facture",
    total: "Total",
    balanceDue: "Solde",
    currency: "Devise",
  };
  return labels[key] ?? key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

export function readablePatientColumns(rows: any[]): string[] {
  const priority = ["medicalRecordNumber", "patientName", "practitionerName", "prescriberName", "attendingPractitionerName", "chiefComplaint", "title", "type", "status", "assessment", "plan", "ward", "bedCode", "room", "invoiceNumber", "total", "balanceDue", "currency", "createdAt", "startedAt", "admittedAt"];
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row)).filter((key) => !isTechnicalPatientColumn(key))));
  return keys.sort((a, b) => {
    const ai = priority.indexOf(a);
    const bi = priority.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  }).slice(0, 7);
}

export function patientFullName(patient: any) {
  return [patient?.firstName, patient?.lastName].filter(Boolean).join(" ") || "Patient";
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

function formatDate(date: Date) {
  const hasTime = date.getUTCHours() + date.getUTCMinutes() + date.getUTCSeconds() + date.getUTCMilliseconds() > 0;
  return new Intl.DateTimeFormat("fr-FR", hasTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}

function stripHtml(value: string): string {
  return value.replace(/<\s*br\s*\/?>/gi, "\n").replace(/<\s*\/div\s*>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").split("\n").map((line) => line.trim()).filter(Boolean).join(" · ");
}
