"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Bed,
  BriefcaseBusiness,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Database,
  FlaskConical,
  HeartPulse,
  Hospital,
  Microscope,
  Package,
  Pill,
  Receipt,
  Search,
  Settings,
  Shield,
  Stethoscope,
  Syringe,
  UserRound,
  Users,
  Warehouse,
} from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";
import { HOSPITAL_GROUPS } from "@/shared/config/hospital-modules";
import Image from "next/image";
import { useMe } from "@/shared/hooks/auth.hooks";
import { getAccessibleHospitalModules } from "@/shared/lib/auth/module-access";

const icons: Record<string, any> = {
  patients: UserRound,
  reception: ClipboardList,
  appointments: CalendarClock,
  emr: Database,
  consultations: Stethoscope,
  emergencies: Activity,
  admissions: Bed,
  nursing: HeartPulse,
  surgery: Syringe,
  icu: HeartPulse,
  laboratory: FlaskConical,
  imaging: Microscope,
  pharmacy: Pill,
  "blood-bank": HeartPulse,
  maternity: Hospital,
  pediatrics: Syringe,
  insurance: Shield,
  billing: Receipt,
  accounting: CreditCard,
  hr: Users,
  procurement: BriefcaseBusiness,
  inventory: Warehouse,
  reports: BarChart3,
  administration: Settings,

};

export default function DashboardSidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [searchTerm, setSearchTerm] = useState("");
  const params = useParams<{ locale?: string }>();
  const pathname = usePathname();
  const locale = params.locale || "fr";
  const { data: user, isLoading } = useMe();
  const accessibleModules = getAccessibleHospitalModules(user);

  const filtered = accessibleModules.filter((module) =>
    `${module.title} ${module.shortTitle ?? ""} ${module.description}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className={`fixed left-0 top-0 z-50 h-full border-r border-slate-200 bg-white transition-all duration-300 ${isCollapsed ? "w-[84px]" : "w-[340px]"}`}>
      <div className="flex h-full flex-col">
        <div className="flex h-24 items-center justify-between border-b border-slate-200 px-6">
          <Link href={`/${locale}/overview`} className="flex items-center gap-4">
            {!isCollapsed && (
              <div>
                <Image src={"/logo.png"} alt={"logo"} width={400} height={400}/>
              </div>
            )}
          </Link>
          <button onClick={toggleSidebar} className="border border-slate-200 p-2 hover:bg-slate-50">
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        <div className="border-b border-slate-100 p-5">
          {!isCollapsed ? (
            <label className="flex h-12 items-center gap-3 border border-slate-200 px-4 focus-within:border-blue-700">
              <Search className="size-5 text-slate-400" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher un module" className="w-full bg-transparent text-sm font-semibold outline-none" />
            </label>
          ) : (
            <Search className="mx-auto size-5 text-slate-400" />
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
          <Link href={`/${locale}/overview`} className={`mb-5 flex items-center gap-4 border-l-4 px-4 py-3.5 text-base font-black ${pathname?.includes('/overview') ? "border-blue-700 bg-blue-50 text-blue-800" : "border-transparent text-slate-700 hover:bg-slate-50"}`}>
            <BarChart3 className="size-6 shrink-0" />{!isCollapsed && <span>Vue globale</span>}
          </Link>

          {HOSPITAL_GROUPS.map((group) => {
            const modules = filtered.filter((module) => module.group === group.key);
            if (!modules.length) return null;
            return (
              <div key={group.key} className="mb-7">
                {!isCollapsed && <p className="mb-3 px-4 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{group.title}</p>}
                <div className="space-y-1">
                  {modules.map((module) => {
                    const Icon = icons[module.key] || Hospital;
                    const href = `/${locale}/hospital/${module.key}`;
                    const active = pathname?.includes(`/hospital/${module.key}`);
                    return (
                      <Link
                        key={module.key}
                        href={href}
                        title={module.title}
                        className={`flex items-center gap-4 border-l-4 px-4 py-3.5 text-[15px] font-bold transition ${active ? "border-blue-700 bg-blue-50 text-blue-800" : "border-transparent text-slate-700 hover:bg-slate-50"} ${isCollapsed ? "justify-center" : ""}`}
                      >
                        <Icon className="size-6 shrink-0" />
                        {!isCollapsed && (
                          <span className="min-w-0 flex-1 truncate">{module.shortTitle || module.title}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {!isLoading && !filtered.length && !isCollapsed && (
            <div className="mx-4 border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-900">Aucun module assigné</p>
              <p className="mt-1 text-xs font-semibold text-amber-800">Demandez à l’administrateur de vérifier vos rôles.</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
