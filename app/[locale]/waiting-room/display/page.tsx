"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Clock, Monitor } from "lucide-react";

type QueuePayload = {
  nowCalling: Array<{ ticketNumber: string; destination?: string; status: string }>;
  waiting: Array<{ ticketNumber: string; destination?: string; patientsBefore?: number; status: string }>;
  updatedAt: string;
};

export default function WaitingRoomDisplayPage() {
  const [facilityId, setFacilityId] = useState("");
  const [practitionerId, setPractitionerId] = useState("");
  const [data, setData] = useState<QueuePayload>({ nowCalling: [], waiting: [], updatedAt: new Date().toISOString() });
  const [error, setError] = useState("");

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

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, [query]);

  const mainTicket = data.nowCalling[0];

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center bg-blue-600">
            <Monitor className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-normal">Salle d’attente</h1>
            <p className="text-lg font-semibold text-slate-300">Suivez votre numéro de ticket.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-300">
          <Clock className="h-5 w-5" />
          <span className="text-xl font-bold">{new Date(data.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </header>

      <section className="mb-8 grid gap-4 border border-white/10 bg-white/5 p-4 md:grid-cols-2">
        <input value={facilityId} onChange={(event) => setFacilityId(event.target.value)} className="h-12 bg-white px-4 font-bold text-slate-950" placeholder="facilityId écran accueil" />
        <input value={practitionerId} onChange={(event) => setPractitionerId(event.target.value)} className="h-12 bg-white px-4 font-bold text-slate-950" placeholder="practitionerId optionnel" />
      </section>

      {error && <p className="mb-6 border border-red-400 bg-red-950 px-5 py-4 text-xl font-black text-red-100">{error}</p>}

      <section className="grid min-h-[70vh] gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col justify-center bg-blue-700 p-10">
          <div className="mb-8 flex items-center gap-4">
            <Bell className="h-12 w-12" />
            <p className="text-3xl font-black">Veuillez entrer</p>
          </div>
          {mainTicket ? (
            <>
              <p className="text-[140px] font-black leading-none tracking-normal">{mainTicket.ticketNumber}</p>
              <p className="mt-8 text-4xl font-black">{mainTicket.destination || "Cabinet"}</p>
            </>
          ) : (
            <p className="text-5xl font-black text-blue-100">Aucun ticket appelé</p>
          )}
        </div>

        <div className="bg-white p-8 text-slate-950">
          <h2 className="mb-6 text-3xl font-black">En attente</h2>
          <div className="grid gap-4">
            {data.waiting.slice(0, 8).map((item, index) => (
              <div key={`${item.ticketNumber}-${index}`} className="grid grid-cols-[120px_1fr] items-center border border-slate-200 p-4">
                <p className="text-3xl font-black text-blue-700">{item.ticketNumber}</p>
                <div>
                  <p className="text-xl font-black">{item.patientsBefore === 0 ? "Préparez-vous" : `${item.patientsBefore} patient(s) avant vous`}</p>
                  <p className="text-sm font-bold text-slate-500">{item.destination || "Salle d’attente"}</p>
                </div>
              </div>
            ))}
            {!data.waiting.length && <p className="py-12 text-center text-xl font-bold text-slate-500">Aucun patient en attente.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
