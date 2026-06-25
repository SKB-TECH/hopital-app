export function normalizeRows(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return data && typeof data === "object" ? [data] : [];
}

export function formatPatientValue(value: any) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function patientFullName(patient: any) {
  return [patient?.firstName, patient?.lastName].filter(Boolean).join(" ") || "Patient";
}
