"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Clock, Maximize2, Monitor, Settings } from "lucide-react";

type QueuePayload = {
  nowCalling: Array<{ ticketNumber: string; destination?: string; status: string }>;
  waiting: Array<{ ticketNumber: string; destination?: string; patientsBefore?: number; status: string }>;
  updatedAt: string;
};
type Option = { id: string; label: string; description?: string };

const storageKey = "afia.waitingRoom.display";

export default function WaitingRoomDisplayPage() {
  const [facilityId, setFacilityId] = useState("");
  const [practitionerId, setPractitionerId] = useState("");
  const [configured, setConfigured] = useState(false);
  const [facilities, setFacilities] = useState<Option[]>([]);
  const [practitioners, setPractitioners] = useState<Option[]>([]);
  const [data, setData] = useState<QueuePayload>({ nowCalling: [], waiting: [], updatedAt: new Date().toISOString() });
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const saved = localStorage.getItem(storageKey);
    const parsed = saved ? JSON.parse(saved) : {};
    const nextFacilityId = params.get("facilityId") || parsed.facilityId || "";
    const nextPractitionerId = params.get("practitionerId") || parsed.practitionerId || "";
    setFacilityId(nextFacilityId);
    setPractitionerId(nextPractitionerId);
    setConfigured(Boolean(nextFacilityId || nextPractitionerId));
    void loadOptions(nextFacilityId);
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ facilityId, practitionerId }));
  }, [facilityId, practitionerId]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (facilityId.trim()) params.set("facilityId", facilityId.trim());
    if (practitionerId.trim()) params.set("practitionerId", practitionerId.trim());
    return params.toString();
  }, [facilityId, practitionerId]);

  async function load() {
    if (!query) return;
    try {
      const response = await fetch(`/api/proxy/api/v1/reception/public-queue?${query}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "File indisponible");
      setData(payload);
      setError("");
    } catch (err: any) {
      setError(err?.message || "File indisponible");
    }
  }

  async function loadOptions(defaultFacilityId = "") {
    try {
      const response = await fetch("/api/proxy/api/v1/reception/public-options", { cache: "no-store" });
      const payload = await response.json();
      setFacilities(payload.facilities || []);
      setPractitioners(payload.practitioners || []);
      if (!defaultFacilityId && !facilityId && payload.facilities?.[0]?.id) setFacilityId(payload.facilities[0].id);
    } catch {
      setFacilities([]);
      setPractitioners([]);
    }
  }

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 4000);
    return () => clearInterval(timer);
  }, [query]);

  const mainTicket = data.nowCalling[0];

  function startDisplay() {
    setConfigured(Boolean(facilityId || practitionerId));
    void document.documentElement.requestFullscreen?.().catch(() => undefined);
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {!configured && (
        <section className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-8">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center bg-blue-600">
              <Monitor className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-normal">Démarrer l’écran salle d’attente</h1>
              <p className="mt-2 text-lg font-semibold text-slate-300">À lancer chaque matin à la réception.</p>
            </div>
          </div>
          <div className="grid gap-4 border border-white/10 bg-white/5 p-6">
            <select value={facilityId} onChange={(event) => setFacilityId(event.target.value)} className="h-14 bg-white px-4 text-lg font-bold text-slate-950">
              <option value="">Choisir un site</option>
              {facilities.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <select value={practitionerId} onChange={(event) => setPractitionerId(event.target.value)} className="h-14 bg-white px-4 text-lg font-bold text-slate-950">
              <option value="">Tous les médecins du site</option>
              {practitioners.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <button onClick={startDisplay} className="flex h-14 items-center justify-center gap-3 bg-blue-600 px-5 text-lg font-black">
              <Maximize2 className="h-5 w-5" />
              Lancer en plein écran
            </button>
          </div>
        </section>
      )}

      {configured && (
        <>
          <header className="flex items-center justify-between border-b border-white/10 px-10 py-7">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center bg-blue-600">
                <Monitor className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-normal">Salle d’attente</h1>
                <p className="text-lg font-semibold text-slate-300">Surveillez votre numéro de ticket.</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <button onClick={() => setConfigured(false)} className="text-slate-400 hover:text-white" title="Configurer">
                <Settings className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-3 text-slate-300">
                <Clock className="h-5 w-5" />
                <span className="text-2xl font-black">{new Date(data.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          </header>

          {error && <p className="mx-10 mt-6 border border-red-400 bg-red-950 px-5 py-4 text-xl font-black text-red-100">{error}</p>}

          <section className="grid min-h-[calc(100vh-113px)] gap-8 p-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="flex flex-col justify-center bg-blue-700 p-12 shadow-2xl">
              <div className="mb-10 flex items-center gap-4">
                <Bell className="h-14 w-14" />
                <p className="text-4xl font-black">Veuillez entrer</p>
              </div>
              {mainTicket ? (
                <>
                  <p className="text-[clamp(7rem,18vw,16rem)] font-black leading-none tracking-normal">{mainTicket.ticketNumber}</p>
                  <p className="mt-8 text-5xl font-black">{mainTicket.destination || "Cabinet"}</p>
                </>
              ) : (
                <p className="text-6xl font-black text-blue-100">En attente d’appel</p>
              )}
            </div>

            <div className="bg-white p-8 text-slate-950 shadow-2xl">
              <h2 className="mb-6 text-4xl font-black">Prochains tickets</h2>
              <div className="grid gap-4">
                {data.waiting.slice(0, 9).map((item, index) => (
                  <div key={`${item.ticketNumber}-${index}`} className="grid grid-cols-[140px_1fr] items-center border border-slate-200 p-5">
                    <p className="text-4xl font-black text-blue-700">{item.ticketNumber}</p>
                    <div>
                      <p className="text-2xl font-black">{item.patientsBefore === 0 ? "Préparez-vous" : `${item.patientsBefore} patient(s) avant vous`}</p>
                      <p className="text-base font-bold text-slate-500">{item.destination || "Salle d’attente"}</p>
                    </div>
                  </div>
                ))}
                {!data.waiting.length && <p className="py-16 text-center text-2xl font-bold text-slate-500">Aucun patient en attente.</p>}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
