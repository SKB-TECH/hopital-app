"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BellRing, CheckCircle2, RefreshCw, Stethoscope } from "lucide-react";
import { api } from "@/shared/lib/http/api";

type WaitingPatient = {
  id: string;
  queueNumber: string;
  patientName: string;
  medicalRecordNumber: string;
  triagePriority: number;
  checkedInAt: string;
  status: string;
};
type Option = { id: string; label: string; description?: string };

export default function DoctorWaitingRoomPage() {
  const [practitionerId, setPractitionerId] = useState("");
  const [rows, setRows] = useState<WaitingPatient[]>([]);
  const [practitioners, setPractitioners] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await api.get("/reception/waiting-room", { params: { practitionerId: practitionerId || undefined, page: 1, limit: 50 } });
      setRows(response.data?.data || []);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Salle d’attente indisponible");
    } finally {
      setLoading(false);
    }
  }

  async function loadOptions() {
    const response = await api.get("/reception/options").catch(() => null);
    setPractitioners(response?.data?.practitioners || []);
  }

  useEffect(() => {
    void loadOptions();
    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, [practitionerId]);

  async function callNext() {
    setLoading(true);
    try {
      await api.post("/reception/call-next", { practitionerId: practitionerId || undefined });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Aucun patient à appeler");
    } finally {
      setLoading(false);
    }
  }

  async function startConsultation(id: string) {
    await api.patch(`/reception/waiting-room/${id}/in-progress`);
    await load();
  }

  const called = rows.find((row) => row.status === "CALLED");
  const waiting = rows.filter((row) => row.status !== "CALLED");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center bg-blue-700 text-white">
              <Stethoscope className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-normal">Salle d’attente médecin</h1>
              <p className="text-sm font-bold text-slate-500">Chaque médecin gère uniquement ses patients en attente.</p>
            </div>
          </div>
          <button onClick={load} className="inline-flex h-12 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-700">
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 p-8 lg:grid-cols-[420px_1fr]">
        <aside className="grid content-start gap-6">
          <div className="border border-slate-200 bg-white p-6 shadow-sm">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase text-slate-500">Filtrer un spécialiste</span>
              <select value={practitionerId} onChange={(event) => setPractitionerId(event.target.value)} className="h-12 border border-slate-300 bg-white px-4 font-bold outline-none focus:border-blue-700">
                <option value="">Mon compte</option>
                {practitioners.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <button onClick={callNext} disabled={loading} className="mt-5 flex h-14 w-full items-center justify-center gap-3 bg-blue-700 text-lg font-black text-white disabled:opacity-60">
              <BellRing className="h-6 w-6" />
              Appeler suivant
            </button>
            {error && <p className="mt-4 border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
          </div>

          <div className="border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase text-slate-500">Patient appelé</p>
            {called ? (
              <div className="mt-4 border border-blue-200 bg-blue-50 p-5">
                <p className="text-5xl font-black text-blue-700">{called.queueNumber}</p>
                <p className="mt-3 text-xl font-black">{called.patientName}</p>
                <p className="text-sm font-bold text-slate-500">{called.medicalRecordNumber}</p>
                <button onClick={() => startConsultation(called.id)} className="mt-5 flex h-12 w-full items-center justify-center gap-2 bg-slate-950 text-sm font-black text-white">
                  <CheckCircle2 className="h-5 w-5" />
                  Commencer consultation
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm font-bold text-slate-500">Aucun patient appelé.</p>
            )}
          </div>
        </aside>

        <section className="border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-2xl font-black">Patients en attente</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">{waiting.length} patient(s) à voir</p>
          </div>
          <div className="divide-y divide-slate-100">
            {waiting.map((row, index) => (
              <div key={row.id} className="grid items-center gap-4 p-5 md:grid-cols-[80px_1fr_150px_160px]">
                <p className="text-2xl font-black text-blue-700">{row.queueNumber}</p>
                <div>
                  <p className="text-lg font-black">{row.patientName}</p>
                  <p className="text-sm font-bold text-slate-500">{row.medicalRecordNumber}</p>
                </div>
                <p className="text-sm font-black text-slate-600">{index === 0 ? "Prochain" : `${index + 1}e position`}</p>
                <button onClick={callNext} className="flex h-11 items-center justify-center gap-2 border border-slate-300 text-sm font-black text-slate-700">
                  <ArrowRight className="h-4 w-4" />
                  Appeler
                </button>
              </div>
            ))}
            {!waiting.length && <p className="p-12 text-center text-lg font-bold text-slate-500">Aucun patient en attente.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
