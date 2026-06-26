"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { HOSPITAL_GROUPS, HOSPITAL_MODULES } from "@/shared/config/hospital-modules";
import { hospitalText, localizeHospitalModule } from "@/shared/config/hospital-i18n";
import { ROLE_MODULE_ACCESS, type HospitalRole, type ModulePermissionAction, type ModulePermissionAssignment, type ModulePermissionScope } from "@/shared/lib/auth/module-access";

const ACTIONS: ModulePermissionAction[] = ["VIEW", "CREATE", "UPDATE", "VALIDATE", "DELETE", "PRINT", "EXPORT", "ADMIN"];
const SCOPES: ModulePermissionScope[] = ["OWN", "TEAM", "DEPARTMENT", "FACILITY", "ORGANIZATION"];
const ACTION_LABELS: Record<ModulePermissionAction, string> = {
  VIEW: "Voir",
  CREATE: "Créer",
  UPDATE: "Modifier",
  VALIDATE: "Valider",
  DELETE: "Supprimer",
  PRINT: "Imprimer",
  EXPORT: "Exporter",
  ADMIN: "Admin",
};
const SCOPE_LABELS: Record<ModulePermissionScope, string> = {
  OWN: "Ses données",
  TEAM: "Équipe",
  DEPARTMENT: "Département",
  FACILITY: "Site",
  ORGANIZATION: "Organisation",
};

export function ModulePermissionsEditor({ value, roles, onChange, locale = "fr" }: { value: any; roles?: any; onChange: (value: ModulePermissionAssignment[]) => void; locale?: string }) {
  const assignments = useMemo(() => normalize(value), [value]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ clinical: true, operations: true, diagnostics: true, finance: true, admin: true });
  const selectedRoles = useMemo(() => normalizeRoles(roles), [roles]);
  const allowedModuleKeys = useMemo(() => allowedModulesForRoles(selectedRoles), [selectedRoles]);
  const localized = useMemo(() => HOSPITAL_MODULES.filter((module) => allowedModuleKeys.has(module.key)).map((module) => localizeHospitalModule(module, locale)), [allowedModuleKeys, locale]);

  useEffect(() => {
    if (!selectedRoles.length) return;
    const next = assignments.filter((assignment) => allowedModuleKeys.has(assignment.moduleKey));
    if (next.length !== assignments.length) onChange(next);
  }, [allowedModuleKeys, assignments, onChange, selectedRoles.length]);

  const setAssignment = (assignment: ModulePermissionAssignment) => {
    const next = assignments.filter((item) => keyOf(item) !== keyOf(assignment));
    if (assignment.permissions.length) next.push({ ...assignment, active: assignment.active !== false });
    onChange(sortAssignments(next));
  };

  const togglePermission = (moduleKey: string, resourceKey: string | null, permission: ModulePermissionAction) => {
    const current = findAssignment(assignments, moduleKey, resourceKey);
    const permissions = new Set(current?.permissions ?? []);
    permissions.has(permission) ? permissions.delete(permission) : permissions.add(permission);
    setAssignment({ moduleKey, resourceKey, permissions: Array.from(permissions), scope: current?.scope ?? "OWN", active: true });
  };

  const setScope = (moduleKey: string, resourceKey: string | null, scope: ModulePermissionScope) => {
    const current = findAssignment(assignments, moduleKey, resourceKey);
    setAssignment({ moduleKey, resourceKey, permissions: current?.permissions?.length ? current.permissions : ["VIEW"], scope, active: true });
  };

  const toggleAllForResource = (moduleKey: string, resourceKey: string | null) => {
    const current = findAssignment(assignments, moduleKey, resourceKey);
    setAssignment({ moduleKey, resourceKey, permissions: current?.permissions?.length ? [] : ["VIEW", "CREATE", "UPDATE", "PRINT"], scope: current?.scope ?? "OWN", active: true });
  };

  return (
    <div className="w-full">
      <div className="w-full overflow-hidden border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-4">
          <p className="text-sm font-black text-slate-900">Permissions par module</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{selectedRoles.length ? "Les modules affichés correspondent aux rôles sélectionnés." : "Choisissez d’abord un ou plusieurs rôles utilisateur."}</p>
        </div>

        {!selectedRoles.length ? (
          <div className="p-5 text-sm font-semibold text-slate-500">Sélectionnez un rôle, par exemple Réceptionniste, Médecin, Caissier ou Pharmacien, pour afficher uniquement ses modules.</div>
        ) : !localized.length ? (
          <div className="p-5 text-sm font-semibold text-amber-800">Aucun module métier n’est prévu pour ce rôle.</div>
        ) : <div className="divide-y divide-slate-200">
          {HOSPITAL_GROUPS.map((group) => {
            const modules = localized.filter((module) => module.group === group.key);
            const open = openGroups[group.key] ?? false;
            return (
              <div key={group.key}>
                <button type="button" onClick={() => setOpenGroups((current) => ({ ...current, [group.key]: !open }))} className="flex w-full items-center justify-between px-3 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500 hover:bg-slate-50 sm:px-4">
                  {hospitalText(group.title, locale)}
                  <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="space-y-3 px-3 pb-4 sm:px-4">
                    {modules.map((module) => (
                      <div key={module.key} className="border border-slate-200">
                        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-3 py-3 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-black leading-tight text-slate-900">{module.title}</p>
                            <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-slate-500">{module.description}</p>
                          </div>
                          <button type="button" onClick={() => toggleAllForResource(module.key, null)} className="border border-blue-700 px-3 py-2 text-xs font-black text-blue-800 hover:bg-blue-50">Tout module</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {module.resources.map((resource) => {
                            const assignment = findAssignment(assignments, module.key, resource.key);
                            return (
                              <div key={resource.key} className="space-y-3 px-3 py-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                  <p className="text-sm font-black leading-tight text-slate-800">{resource.title}</p>
                                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-500">{resource.description}</p>
                                  </div>
                                  <button type="button" onClick={() => toggleAllForResource(module.key, resource.key)} className="w-fit shrink-0 border border-blue-700 px-2.5 py-1.5 text-[11px] font-black text-blue-800 hover:bg-blue-50 sm:px-3 sm:py-2 sm:text-xs">{assignment?.permissions?.length ? "Retirer" : "Accès standard"}</button>
                                </div>
                                <div className="grid gap-3 xl:grid-cols-[1fr_180px] xl:items-start">
                                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:flex xl:flex-wrap">
                                    {ACTIONS.map((action) => {
                                      const checked = assignment?.permissions?.includes(action) ?? false;
                                      return (
                                        <label key={action} className={`inline-flex min-h-9 min-w-0 items-center gap-2 border px-2 py-1.5 text-[11px] font-black sm:px-2.5 sm:py-2 sm:text-xs xl:min-w-[96px] ${checked ? "border-blue-700 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600"}`}>
                                          <input className="shrink-0" type="checkbox" checked={checked} onChange={() => togglePermission(module.key, resource.key, action)} />
                                          <span className="truncate">{ACTION_LABELS[action]}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                  <label className="block">
                                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Portée</span>
                                    <select value={assignment?.scope ?? "OWN"} onChange={(event) => setScope(module.key, resource.key, event.target.value as ModulePermissionScope)} className="h-10 w-full border border-slate-200 bg-white px-2 text-xs font-black text-slate-700 outline-none focus:border-blue-700">
                                      {SCOPES.map((scope) => <option key={scope} value={scope}>{SCOPE_LABELS[scope]}</option>)}
                                    </select>
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>}
      </div>
    </div>
  );
}

function normalize(value: any): ModulePermissionAssignment[] {
  return (Array.isArray(value) ? value : [])
    .map((item: any) => ({
      moduleKey: String(item?.moduleKey ?? "").trim(),
      resourceKey: item?.resourceKey ?? null,
      permissions: Array.isArray(item?.permissions) ? item.permissions : [],
      scope: item?.scope ?? "OWN",
      active: item?.active !== false,
    }))
    .filter((item) => item.moduleKey && item.permissions.length);
}

function findAssignment(assignments: ModulePermissionAssignment[], moduleKey: string, resourceKey: string | null) {
  return assignments.find((assignment) => assignment.moduleKey === moduleKey && (assignment.resourceKey ?? null) === resourceKey);
}

function keyOf(assignment: ModulePermissionAssignment) {
  return `${assignment.moduleKey}:${assignment.resourceKey ?? "*"}`;
}

function sortAssignments(assignments: ModulePermissionAssignment[]) {
  return [...assignments].sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
}

function normalizeRoles(value: any): HospitalRole[] {
  const roles = Array.isArray(value) ? value : typeof value === "string" && value ? value.split(",") : [];
  return roles
    .map((role: any) => String(role ?? "").trim().toUpperCase())
    .filter((role: string): role is HospitalRole => role in ROLE_MODULE_ACCESS);
}

function allowedModulesForRoles(roles: HospitalRole[]) {
  const modules = roles.includes("SUPER_ADMIN") || roles.includes("HOSPITAL_ADMIN")
    ? HOSPITAL_MODULES.map((module) => module.key)
    : roles.flatMap((role) => ROLE_MODULE_ACCESS[role] ?? []);
  return new Set(modules);
}
