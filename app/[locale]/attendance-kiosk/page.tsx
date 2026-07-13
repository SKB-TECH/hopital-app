"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, Clock3, Loader2, LogIn, LogOut, Search, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/shared/lib/http/api";

type Employee = {
  id: string;
  employeeNumber?: string;
  badgeNumber?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  department?: string;
  position?: string;
  status?: string;
};

type AttendanceEvent = {
  id?: string;
  employeeName?: string;
  employeeNumber?: string;
  fullName?: string;
  type?: string;
  eventAt?: string;
  createdAt?: string;
};

function normalizeRows(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

function employeeLabel(employee: Employee) {
  const name = [employee.firstName, employee.lastName].filter(Boolean).join(" ").trim();
  return name || employee.employeeNumber || employee.email || "Employé";
}

function eventTypeLabel(type?: string) {
  if (type === "CHECK_OUT") return "Départ enregistré";
  if (type === "CHECK_IN") return "Arrivée enregistrée";
  return type || "Pointage enregistré";
}

export default function AttendanceKioskPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "fr";
  const [now, setNow] = useState(new Date());
  const [mode, setMode] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
  const [query, setQuery] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [badgeUid, setBadgeUid] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [posting, setPosting] = useState(false);
  const [lastEvent, setLastEvent] = useState<AttendanceEvent | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void searchEmployees(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  async function searchEmployees(value: string) {
    const search = value.trim();
    if (search.length < 2) {
      setEmployees([]);
      return;
    }
    setLoadingEmployees(true);
    try {
      const response = await api.get("/hr/employees", { params: { search, page: 1, limit: 10 } });
      setEmployees(normalizeRows(response.data));
    } catch (error: any) {
      setEmployees([]);
      toast.error(error?.response?.data?.message || "Recherche employé indisponible.");
    } finally {
      setLoadingEmployees(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selectedEmployee?.id) {
      toast.error("Sélectionnez d'abord l'employé à pointer.");
      return;
    }
    setPosting(true);
    try {
      const response = await api.post("/hr/attendance-events", {
        employeeId: selectedEmployee.id,
        eventAt: new Date().toISOString(),
        type: mode,
        source: "MANUAL",
        badgeUid: badgeUid || selectedEmployee.badgeNumber || selectedEmployee.employeeNumber || undefined,
        deviceId: "FRONT_DESK_ATTENDANCE_KIOSK",
        metadata: {
          kiosk: true,
          capturedBy: "frontdesk",
          capturedAt: new Date().toISOString(),
        },
      });
      const event = response.data || {};
      setLastEvent({
        ...event,
        employeeName: employeeLabel(selectedEmployee),
        employeeNumber: selectedEmployee.employeeNumber,
        type: mode,
        eventAt: event.eventAt || new Date().toISOString(),
      });
      toast.success(mode === "CHECK_IN" ? "Arrivée enregistrée." : "Départ enregistré.");
      setQuery("");
      setEmployees([]);
      setSelectedEmployee(null);
      setBadgeUid("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Impossible d'enregistrer le pointage.");
    } finally {
      setPosting(false);
    }
  }

  const currentDate = useMemo(() => now.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }), [now]);
  const currentTime = useMemo(() => now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), [now]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-rows-[auto_1fr] px-6 py-6">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/hospital/hr?resource=attendance`} className="flex h-12 w-12 items-center justify-center border border-white/15 bg-white/5 text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex h-14 w-14 items-center justify-center bg-blue-700">
              <BadgeCheck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-normal">Kiosque de présence</h1>
              <p className="text-sm font-bold text-slate-300">Pointage arrivée et départ du personnel.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black uppercase text-blue-200">{currentDate}</p>
            <p className="text-3xl font-black tabular-nums">{currentTime}</p>
          </div>
        </header>

        <section className="grid items-start gap-6 py-8 lg:grid-cols-[1fr_390px]">
          <form onSubmit={submit} className="grid gap-6 border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-blue-700 text-white">
                <UserRound className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Identifier l’employé</h2>
                <p className="text-sm font-bold text-slate-500">Recherchez par nom, matricule, téléphone ou email.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border border-slate-200 bg-slate-50 p-2">
              <button type="button" onClick={() => setMode("CHECK_IN")} className={`flex h-16 items-center justify-center gap-3 text-lg font-black ${mode === "CHECK_IN" ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-white"}`}>
                <LogIn className="h-6 w-6" />
                Arrivée
              </button>
              <button type="button" onClick={() => setMode("CHECK_OUT")} className={`flex h-16 items-center justify-center gap-3 text-lg font-black ${mode === "CHECK_OUT" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-white"}`}>
                <LogOut className="h-6 w-6" />
                Départ
              </button>
            </div>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase text-slate-500">Recherche employé</span>
              <div className="flex h-16 items-center border border-slate-300 bg-white px-4 focus-within:border-blue-700">
                <Search className="mr-3 h-6 w-6 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus className="h-full flex-1 text-xl font-black outline-none" placeholder="Nom, matricule, téléphone..." />
                {loadingEmployees && <Loader2 className="h-5 w-5 animate-spin text-blue-700" />}
              </div>
            </label>

            {!!employees.length && (
              <div className="grid max-h-80 gap-2 overflow-auto border border-slate-200 bg-slate-50 p-2">
                {employees.map((employee) => (
                  <button key={employee.id} type="button" onClick={() => setSelectedEmployee(employee)} className={`grid gap-1 border px-4 py-4 text-left ${selectedEmployee?.id === employee.id ? "border-blue-700 bg-blue-50 text-blue-900" : "border-slate-200 bg-white hover:border-blue-300"}`}>
                    <span className="text-lg font-black">{employeeLabel(employee)}</span>
                    <span className="text-sm font-bold text-slate-500">
                      {[employee.employeeNumber, employee.department, employee.position].filter(Boolean).join(" · ") || "Dossier employé"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase text-slate-500">Badge ou référence</span>
              <input value={badgeUid} onChange={(event) => setBadgeUid(event.target.value)} className="h-14 border border-slate-300 px-4 text-lg font-bold outline-none focus:border-blue-700" placeholder="Optionnel si badge absent" />
            </label>

            <div className="border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs font-black uppercase text-blue-700">Sélection</p>
              <p className="mt-1 text-2xl font-black">{selectedEmployee ? employeeLabel(selectedEmployee) : "Aucun employé sélectionné"}</p>
              {selectedEmployee && <p className="mt-1 text-sm font-bold text-slate-600">{[selectedEmployee.employeeNumber, selectedEmployee.department, selectedEmployee.position].filter(Boolean).join(" · ")}</p>}
            </div>

            <button type="submit" disabled={posting || !selectedEmployee} className="flex h-16 items-center justify-center gap-3 bg-blue-700 text-xl font-black text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300">
              {posting ? <Loader2 className="h-6 w-6 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
              Valider le pointage
            </button>
          </form>

          <aside className="grid gap-6">
            <div className="border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center bg-white text-slate-950">
                  <Clock3 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-blue-200">Session kiosk</p>
                  <h2 className="text-xl font-black">Prêt au pointage</h2>
                </div>
              </div>
              <div className="mt-6 grid gap-3 text-sm font-bold text-slate-300">
                <p>1. Recherchez l’employé.</p>
                <p>2. Sélectionnez arrivée ou départ.</p>
                <p>3. Validez, puis le registre RH est mis à jour.</p>
              </div>
            </div>

            <div className="border border-white/10 bg-white p-6 text-slate-950">
              <p className="text-xs font-black uppercase text-slate-500">Dernier pointage</p>
              {lastEvent ? (
                <div className="mt-4 grid gap-3">
                  <p className="text-2xl font-black">{lastEvent.employeeName || lastEvent.fullName}</p>
                  <p className="text-lg font-black text-blue-700">{eventTypeLabel(lastEvent.type)}</p>
                  <p className="text-sm font-bold text-slate-500">{lastEvent.employeeNumber || ""}</p>
                  <p className="text-sm font-bold text-slate-500">{new Date(lastEvent.eventAt || lastEvent.createdAt || Date.now()).toLocaleString("fr-FR")}</p>
                </div>
              ) : (
                <p className="mt-4 text-sm font-bold text-slate-500">Aucun pointage validé sur cet écran.</p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
