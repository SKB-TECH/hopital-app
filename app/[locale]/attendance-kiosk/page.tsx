"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, Loader2, LocateFixed, LogIn, LogOut, RefreshCcw, Search, Smartphone, UserRound } from "lucide-react";
import { api } from "@/shared/lib/http/api";
import { useMe } from "@/shared/hooks/auth.hooks";

type Employee = {
  id: string;
  employeeNumber?: string;
  badgeNumber?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  position?: string;
  status?: string;
  metadata?: {
    attendancePinConfigured?: boolean;
  };
};

type GeoPoint = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

function normalizeRows(payload: any): Employee[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

function employeeName(employee?: Employee) {
  return [employee?.firstName, employee?.lastName].filter(Boolean).join(" ") || "Employé";
}

function getDeviceId() {
  if (typeof window === "undefined") return "WEB-KIOSK";
  const storageKey = "afia_attendance_kiosk_device_id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;
  const generated = `ANDROID-KIOSK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  window.localStorage.setItem(storageKey, generated);
  return generated;
}

export default function AttendanceKioskPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale || "fr";
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useMe();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState<"CHECK_IN" | "CHECK_OUT" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attendancePin, setAttendancePin] = useState("");
  const [deviceId, setDeviceId] = useState("WEB-KIOSK");
  const [geo, setGeo] = useState<GeoPoint | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setDeviceId(getDeviceId());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/hr/employees", { params: { limit: 100 } });
      setEmployees(normalizeRows(response.data).filter((employee) => !employee.status || employee.status === "ACTIVE" || employee.status === "PROBATION"));
    } catch (err: any) {
      setEmployees([]);
      setError(err?.response?.data?.message || err?.message || "Impossible de charger les employés.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && user) loadEmployees();
    if (!userLoading && !user) setLoading(false);
  }, [userLoading, user?.id]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return employees.slice(0, 12);
    return employees
      .filter((employee) => JSON.stringify(employee).toLowerCase().includes(term))
      .slice(0, 20);
  }, [employees, query]);

  const captureLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("La localisation n’est pas disponible sur cet appareil.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => setError("Localisation refusée ou indisponible."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const punch = async (type: "CHECK_IN" | "CHECK_OUT") => {
    if (!selected) return;
    if (!/^\d{4,8}$/.test(attendancePin.trim())) {
      setError("Entrez le PIN employé : 4 à 8 chiffres.");
      return;
    }
    setPosting(type);
    setError("");
    setSuccess("");
    try {
      await api.post("/hr/attendance-events", {
        employeeId: selected.id,
        eventAt: new Date().toISOString(),
        type,
        source: "MOBILE",
        deviceId,
        attendancePin: attendancePin.trim(),
        metadata: {
          kiosk: true,
          deviceId,
          capturedByUserId: user?.id,
          capturedByEmail: user?.email,
          employeeNumber: selected.employeeNumber,
          badgeNumber: selected.badgeNumber,
          userAgent: navigator.userAgent,
          geolocation: geo,
        },
      });
      setSuccess(`${employeeName(selected)} : ${type === "CHECK_IN" ? "arrivée enregistrée" : "sortie enregistrée"}.`);
      setSelected(null);
      setQuery("");
      setAttendancePin("");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Pointage impossible.");
    } finally {
      setPosting(null);
    }
  };

  if (userLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="border border-white/15 bg-white/5 p-10 text-center">
          <Loader2 className="mx-auto mb-4 size-9 animate-spin text-blue-300" />
          <p className="text-lg font-black">Chargement du kiosque présence...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="max-w-xl border border-red-300/30 bg-red-500/10 p-8 text-center">
          <h1 className="text-2xl font-black">Connexion requise</h1>
          <p className="mt-3 text-sm font-semibold text-red-100">Un RH ou administrateur doit ouvrir la session avant d’utiliser le kiosque de présence.</p>
          <button onClick={() => router.push(`/${locale}`)} className="mt-6 h-12 bg-white px-6 text-sm font-black text-slate-950">Se connecter</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-3 text-white sm:p-5">
      <section className="mx-auto flex min-h-[calc(100vh-24px)] max-w-7xl flex-col border border-white/15 bg-white">
        <header className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 p-5 text-slate-950 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push(`/${locale}/hospital/hr?resource=attendance`)} className="grid size-12 place-items-center border border-slate-300 bg-white text-slate-700">
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-700">Afia-Smart</p>
              <h1 className="text-2xl font-black sm:text-3xl">Kiosque de présence</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">Pointage employés sur tablette ou téléphone Android.</p>
            </div>
          </div>
          <div className="grid gap-2 text-sm font-black text-slate-700 sm:grid-cols-3">
            <div className="border border-slate-200 bg-white px-4 py-3">
              <Clock3 className="mb-1 size-4 text-blue-700" />
              {now.toLocaleTimeString(locale === "en" ? "en-US" : "fr-FR")}
            </div>
            <div className="border border-slate-200 bg-white px-4 py-3">
              <Smartphone className="mb-1 size-4 text-blue-700" />
              {deviceId}
            </div>
            <button onClick={captureLocation} className="border border-slate-200 bg-white px-4 py-3 text-left hover:border-blue-700">
              <LocateFixed className="mb-1 size-4 text-blue-700" />
              {geo ? "Position active" : "Activer position"}
            </button>
          </div>
        </header>

        <div className="grid flex-1 gap-0 lg:grid-cols-[minmax(320px,440px)_1fr]">
          <aside className="border-b border-slate-200 bg-white p-5 text-slate-950 lg:border-b-0 lg:border-r">
            <label className="flex h-14 items-center gap-3 border border-slate-300 bg-slate-50 px-4 focus-within:border-blue-700 focus-within:bg-white">
              <Search className="size-5 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, matricule, badge..." className="w-full bg-transparent text-base font-bold outline-none" />
            </label>
            <div className="mt-4 flex items-center justify-between text-xs font-black uppercase tracking-wide text-slate-500">
              <span>Employés</span>
              <button onClick={loadEmployees} className="inline-flex items-center gap-2 text-blue-700"><RefreshCcw className="size-4" />Actualiser</button>
            </div>
            <div className="mt-3 max-h-[52vh] space-y-2 overflow-y-auto pr-1 lg:max-h-[calc(100vh-250px)]">
              {filtered.map((employee) => (
                <button key={employee.id} onClick={() => { setSelected(employee); setAttendancePin(""); setSuccess(""); setError(""); }} className={`w-full border p-4 text-left ${selected?.id === employee.id ? "border-blue-700 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-400"}`}>
                  <div className="flex items-start gap-3">
                    <div className="grid size-11 shrink-0 place-items-center bg-slate-100 text-blue-700">
                      <UserRound className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-slate-950">{employeeName(employee)}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{employee.employeeNumber || employee.badgeNumber || "Sans matricule"}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-500">{[employee.department, employee.position].filter(Boolean).join(" · ")}</p>
                      <p className={`mt-2 text-xs font-black ${employee.metadata?.attendancePinConfigured ? "text-emerald-700" : "text-amber-700"}`}>{employee.metadata?.attendancePinConfigured ? "PIN configuré" : "PIN non configuré"}</p>
                    </div>
                  </div>
                </button>
              ))}
              {!filtered.length && <p className="border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">Aucun employé trouvé.</p>}
            </div>
          </aside>

          <section className="flex items-center justify-center bg-slate-100 p-5 text-slate-950">
            <div className="w-full max-w-3xl border border-slate-200 bg-white p-6 sm:p-8">
              {error && <div className="mb-5 border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{Array.isArray(error) ? error.join(", ") : error}</div>}
              {success && <div className="mb-5 border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><CheckCircle2 className="mr-2 inline size-5" />{success}</div>}

              {selected ? (
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700">Employé sélectionné</p>
                  <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{employeeName(selected)}</h2>
                  <p className="mt-3 text-lg font-bold text-slate-500">{selected.employeeNumber || selected.badgeNumber || "Matricule non renseigné"}</p>
                  <p className="mt-1 text-base font-semibold text-slate-500">{[selected.department, selected.position].filter(Boolean).join(" · ")}</p>

                  <label className="mt-8 block">
                    <span className="mb-2 block text-sm font-black uppercase tracking-wide text-slate-500">PIN employé</span>
                    <input
                      value={attendancePin}
                      onChange={(event) => setAttendancePin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      type="password"
                      autoFocus
                      placeholder="4 à 8 chiffres"
                      className="h-16 w-full border border-slate-300 bg-slate-50 px-5 text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-blue-700 focus:bg-white"
                    />
                    <p className="mt-2 text-sm font-semibold text-slate-500">Le pointage sera refusé si le PIN ne correspond pas à cet employé.</p>
                  </label>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <button disabled={Boolean(posting) || attendancePin.length < 4} onClick={() => punch("CHECK_IN")} className="flex min-h-32 flex-col items-center justify-center bg-emerald-600 p-6 text-center text-white hover:bg-emerald-700 disabled:opacity-60">
                      {posting === "CHECK_IN" ? <Loader2 className="mb-3 size-8 animate-spin" /> : <LogIn className="mb-3 size-9" />}
                      <span className="text-2xl font-black">Arrivée</span>
                      <span className="mt-1 text-sm font-bold text-emerald-50">CHECK IN</span>
                    </button>
                    <button disabled={Boolean(posting) || attendancePin.length < 4} onClick={() => punch("CHECK_OUT")} className="flex min-h-32 flex-col items-center justify-center bg-slate-900 p-6 text-center text-white hover:bg-slate-800 disabled:opacity-60">
                      {posting === "CHECK_OUT" ? <Loader2 className="mb-3 size-8 animate-spin" /> : <LogOut className="mb-3 size-9" />}
                      <span className="text-2xl font-black">Sortie</span>
                      <span className="mt-1 text-sm font-bold text-slate-300">CHECK OUT</span>
                    </button>
                  </div>

                  <button onClick={() => { setSelected(null); setAttendancePin(""); }} className="mt-5 h-12 w-full border border-slate-300 bg-white text-sm font-black text-slate-700 hover:bg-slate-50">Changer d’employé</button>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <UserRound className="mx-auto mb-5 size-16 text-slate-300" />
                  <h2 className="text-3xl font-black text-slate-950">Sélectionnez un employé</h2>
                  <p className="mx-auto mt-3 max-w-md text-base font-semibold text-slate-500">Recherchez par nom, matricule ou badge, puis enregistrez l’arrivée ou la sortie.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
