import type { PrintTemplate } from "@/shared/services/print.service";

export function categoryFromModule(moduleKey: string) {
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

export function pickDefaultTemplate(templates: PrintTemplate[], moduleKey: string) {
  if (moduleKey === "billing/invoices") return templates.find((template) => template.key === "invoice")?.key ?? "invoice";
  if (moduleKey === "pharmacy/dispensations") return templates.find((template) => template.key === "medicine-receipt")?.key ?? "medicine-receipt";
  if (moduleKey === "pharmacy/sales") return templates.find((template) => template.key === "pharmacy-sale-receipt")?.key ?? "pharmacy-sale-receipt";
  return templates.find((template) => template.defaultModule === moduleKey)?.key
    ?? templates.find((template) => template.category === categoryFromModule(moduleKey))?.key
    ?? "generic-record";
}
