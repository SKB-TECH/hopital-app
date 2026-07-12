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

export type ModulePermissionAction = "VIEW" | "CREATE" | "UPDATE" | "VALIDATE" | "DELETE" | "PRINT" | "EXPORT" | "ADMIN";
export type ModulePermissionScope = "OWN" | "TEAM" | "DEPARTMENT" | "FACILITY" | "ORGANIZATION";

export type ModulePermissionAssignment = {
  moduleKey: string;
  resourceKey?: string | null;
  permissions: ModulePermissionAction[];
  scope?: ModulePermissionScope;
  facilityId?: string | null;
  departmentId?: string | null;
  active?: boolean;
};

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
  DIRECTOR: ["reports", "patients", "admissions", "billing", "hr", "inventory", "procurement"],
  MEDICAL_DIRECTOR: ["reports", "patients", "emr", "consultations", "appointments", "emergencies", "admissions", "nursing", "surgery", "technical-platform", "laboratory", "imaging", "pharmacy", "maternity", "pediatrics"],
  DOCTOR: ["patients", "emr", "consultations", "appointments", "emergencies", "admissions", "nursing", "surgery", "technical-platform", "laboratory", "imaging", "pharmacy", "maternity", "pediatrics"],
  GENERAL_PRACTITIONER: ["patients", "emr", "consultations", "appointments", "emergencies", "admissions", "nursing", "technical-platform", "laboratory", "imaging", "pharmacy"],
  GYNECOLOGIST: ["patients", "emr", "consultations", "appointments", "emergencies", "admissions", "nursing", "technical-platform", "laboratory", "imaging", "pharmacy", "maternity"],
  OBSTETRICIAN: ["patients", "emr", "consultations", "appointments", "emergencies", "admissions", "nursing", "technical-platform", "laboratory", "imaging", "pharmacy", "maternity", "pediatrics"],
  PEDIATRICIAN: ["patients", "emr", "consultations", "appointments", "emergencies", "admissions", "nursing", "technical-platform", "laboratory", "imaging", "pharmacy", "pediatrics"],
  SURGEON: ["patients", "emr", "consultations", "appointments", "emergencies", "admissions", "nursing", "surgery", "technical-platform", "laboratory", "imaging", "pharmacy"],
  NURSE: ["patients", "appointments", "emergencies", "admissions", "nursing", "maternity", "pediatrics", "pharmacy"],
  MIDWIFE: ["patients", "appointments", "emergencies", "admissions", "nursing", "maternity", "pediatrics", "pharmacy"],
  RECEPTIONIST: ["patients", "reception", "appointments", "admissions", "insurance"],
  LAB_TECHNICIAN: ["patients", "technical-platform", "laboratory"],
  BIOLOGIST: ["patients", "technical-platform", "laboratory"],
  RADIOLOGIST: ["patients", "technical-platform", "imaging"],
  PHARMACIST: ["patients", "pharmacy", "inventory"],
  CASHIER: ["patients", "billing", "insurance"],
  ACCOUNTANT: ["billing", "insurance", "reports"],
  HR: ["hr", "reports"],
  STOREKEEPER: ["inventory", "procurement", "pharmacy"],
  AUDITOR: ["reports", "billing", "inventory", "administration"],
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
  if (roles.includes("SUPER_ADMIN") || roles.includes("HOSPITAL_ADMIN")) return true;
  const explicit = getModuleAssignments(user).filter((assignment) => assignment.moduleKey === moduleKey && assignment.active !== false);
  if (explicit.length) {
    return explicit.some((assignment) => assignment.permissions.includes("VIEW") || assignment.permissions.includes("ADMIN"));
  }
  if (!roles.length) return false;
  return roles.some((role) => ROLE_MODULE_ACCESS[role]?.includes(moduleKey));
}

export function getAccessibleHospitalModules(user: any): HospitalModule[] {
  const roles = getUserRoles(user);
  if (roles.includes("SUPER_ADMIN") || roles.includes("HOSPITAL_ADMIN")) return HOSPITAL_MODULES;
  const assignments = getModuleAssignments(user);
  if (!roles.length && !assignments.length) return [];
  const allowed = new Set(roles.flatMap((role) => ROLE_MODULE_ACCESS[role] ?? []));
  return HOSPITAL_MODULES.filter((module) => {
    const explicit = assignments.filter((assignment) => assignment.moduleKey === module.key && assignment.active !== false);
    if (explicit.length) return explicit.some((assignment) => assignment.permissions.includes("VIEW") || assignment.permissions.includes("ADMIN"));
    return allowed.has(module.key);
  });
}

export function getFirstAccessibleHospitalModule(user: any) {
  return getAccessibleHospitalModules(user)[0] ?? null;
}

export function getModuleAssignments(user: any): ModulePermissionAssignment[] {
  const raw = user?.modulePermissions ?? user?.module_permissions ?? [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => ({
      moduleKey: String(item?.moduleKey ?? item?.module_key ?? "").trim(),
      resourceKey: item?.resourceKey ?? item?.resource_key ?? null,
      permissions: normalizePermissionActions(item?.permissions),
      scope: item?.scope,
      facilityId: item?.facilityId ?? item?.facility_id ?? null,
      departmentId: item?.departmentId ?? item?.department_id ?? null,
      active: item?.active !== false,
    }))
    .filter((assignment) => assignment.moduleKey && assignment.permissions.length);
}

export function hasHospitalModulePermission(user: any, moduleKey?: string, resourceKey?: string | null, action: ModulePermissionAction = "VIEW") {
  if (!moduleKey) return false;
  const roles = getUserRoles(user);
  if (roles.includes("SUPER_ADMIN") || roles.includes("HOSPITAL_ADMIN")) return true;

  const moduleAssignments = getModuleAssignments(user).filter((assignment) => assignment.moduleKey === moduleKey && assignment.active !== false);
  if (moduleAssignments.length) {
    const exact = moduleAssignments.filter((assignment) => (assignment.resourceKey ?? null) === (resourceKey ?? null));
    const wildcard = moduleAssignments.filter((assignment) => !assignment.resourceKey);
    return [...exact, ...wildcard].some((assignment) => assignment.permissions.includes("ADMIN") || assignment.permissions.includes(action));
  }

  const hasRoleAccess = roles.some((role) => ROLE_MODULE_ACCESS[role]?.includes(moduleKey));
  if (!hasRoleAccess) return false;
  if (action === "DELETE") return roles.some((role) => ["DIRECTOR", "MEDICAL_DIRECTOR", "SUPER_ADMIN", "HOSPITAL_ADMIN"].includes(role));
  if (action === "ADMIN") return false;
  return true;
}

export function canAccessHospitalResource(user: any, moduleKey?: string, resourceKey?: string | null) {
  return hasHospitalModulePermission(user, moduleKey, resourceKey, "VIEW");
}

export function getAccessibleHospitalResources(user: any, module: HospitalModule) {
  return module.resources.filter((resource) => canAccessHospitalResource(user, module.key, resource.key));
}

function normalizePermissionActions(value: any): ModulePermissionAction[] {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const allowed: ModulePermissionAction[] = ["VIEW", "CREATE", "UPDATE", "VALIDATE", "DELETE", "PRINT", "EXPORT", "ADMIN"];
  return values
    .map((item: any) => String(item ?? "").trim().toUpperCase())
    .filter((item: string): item is ModulePermissionAction => allowed.includes(item as ModulePermissionAction));
}
