import { HOSPITAL_MODULES } from "@/shared/config/hospital-modules";
import type { HospitalModule } from "@/shared/types/hospital.types";

export type HospitalRole =
  | "SUPER_ADMIN"
  | "HOSPITAL_ADMIN"
  | "DIRECTOR"
  | "MEDICAL_DIRECTOR"
  | "DOCTOR"
  | "GENERAL_PRACTITIONER"
  | "GYNECOLOGIST"
  | "OBSTETRICIAN"
  | "PEDIATRICIAN"
  | "SURGEON"
  | "NURSE"
  | "MIDWIFE"
  | "RECEPTIONIST"
  | "LAB_TECHNICIAN"
  | "BIOLOGIST"
  | "RADIOLOGIST"
  | "PHARMACIST"
  | "CASHIER"
  | "ACCOUNTANT"
  | "HR"
  | "STOREKEEPER"
  | "AUDITOR"
  | "MEDICAL_RECORDS_OFFICER"
  | "PATIENT";

const ALL_MODULES = HOSPITAL_MODULES.map((module) => module.key);

const ROLE_ALIASES: Record<string, HospitalRole> = {
  CHIRURGIEN: "SURGEON",
  CHIRURGIENNE: "SURGEON",
  CHIRURGIE: "SURGEON",
  SURGERY: "SURGEON",
  SURGICAL: "SURGEON",
  MEDECIN: "DOCTOR",
  MÉDECIN: "DOCTOR",
  INFIRMIER: "NURSE",
  INFIRMIERE: "NURSE",
  INFIRMIÈRE: "NURSE",
};

export const ROLE_MODULE_ACCESS: Record<HospitalRole, string[]> = {
  SUPER_ADMIN: ALL_MODULES,
  HOSPITAL_ADMIN: ALL_MODULES,
  DIRECTOR: ["reports", "patients", "admissions", "billing", "accounting", "hr", "inventory", "procurement"],
  MEDICAL_DIRECTOR: ["reports", "patients", "emr", "consultations", "appointments", "emergencies", "admissions", "nursing", "surgery", "icu", "laboratory", "imaging", "pharmacy", "blood-bank", "maternity", "pediatrics"],
  DOCTOR: ["patients", "emr", "consultations", "appointments", "emergencies", "admissions", "nursing", "surgery", "icu", "laboratory", "imaging", "pharmacy", "blood-bank", "maternity", "pediatrics"],
  GENERAL_PRACTITIONER: ["patients", "emr", "consultations", "appointments", "emergencies", "admissions", "nursing", "icu", "laboratory", "imaging", "pharmacy"],
  GYNECOLOGIST: ["patients", "emr", "consultations", "appointments", "emergencies", "admissions", "nursing", "laboratory", "imaging", "pharmacy", "blood-bank", "maternity"],
  OBSTETRICIAN: ["patients", "emr", "consultations", "appointments", "emergencies", "admissions", "nursing", "laboratory", "imaging", "pharmacy", "blood-bank", "maternity", "pediatrics"],
  PEDIATRICIAN: ["patients", "emr", "consultations", "appointments", "emergencies", "admissions", "nursing", "icu", "laboratory", "imaging", "pharmacy", "pediatrics"],
  SURGEON: ["patients", "emr", "consultations", "appointments", "emergencies", "admissions", "nursing", "surgery", "icu", "laboratory", "imaging", "pharmacy", "blood-bank"],
  NURSE: ["patients", "appointments", "emergencies", "admissions", "nursing", "icu", "maternity", "pediatrics", "pharmacy"],
  MIDWIFE: ["patients", "appointments", "emergencies", "admissions", "nursing", "maternity", "pediatrics", "pharmacy"],
  RECEPTIONIST: ["patients", "reception", "appointments", "admissions", "insurance"],
  LAB_TECHNICIAN: ["patients", "laboratory"],
  BIOLOGIST: ["patients", "laboratory"],
  RADIOLOGIST: ["patients", "imaging"],
  PHARMACIST: ["patients", "pharmacy", "inventory"],
  CASHIER: ["patients", "billing", "insurance"],
  ACCOUNTANT: ["billing", "accounting", "insurance", "reports"],
  HR: ["hr", "reports"],
  STOREKEEPER: ["inventory", "procurement", "pharmacy"],
  AUDITOR: ["reports", "billing", "accounting", "inventory", "administration"],
  MEDICAL_RECORDS_OFFICER: ["patients", "emr", "reports"],
  PATIENT: [],
};

export function getUserRoles(user: any): HospitalRole[] {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  return roles
    .map((role: any) => normalizeRoleName(role?.name ?? role?.label ?? role))
    .filter((role: string): role is HospitalRole => role in ROLE_MODULE_ACCESS);
}

function normalizeRoleName(value: any) {
  const role = String(value ?? "").trim().toUpperCase();
  return ROLE_ALIASES[role] ?? role;
}

export function canAccessHospitalModule(user: any, moduleKey?: string) {
  if (!moduleKey) return false;
  const roles = getUserRoles(user);
  if (!roles.length) return false;
  return roles.some((role) => ROLE_MODULE_ACCESS[role]?.includes(moduleKey));
}

export function getAccessibleHospitalModules(user: any): HospitalModule[] {
  const roles = getUserRoles(user);
  if (!roles.length) return [];
  const allowed = new Set(roles.flatMap((role) => ROLE_MODULE_ACCESS[role] ?? []));
  return HOSPITAL_MODULES.filter((module) => allowed.has(module.key));
}

export function getFirstAccessibleHospitalModule(user: any) {
  return getAccessibleHospitalModules(user)[0] ?? null;
}
