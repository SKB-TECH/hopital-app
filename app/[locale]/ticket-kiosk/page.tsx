"use client";

import { FormEvent, useState } from "react";
import { Printer, TicketCheck } from "lucide-react";

type TicketResponse = {
  ticketNumber: string;
  practitionerLabel?: string;
  appointmentTime?: string;
  printHtml?: string;
};

export default function TicketKioskPage() {
  const [appointmentId, setAppointmentId] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setTicket(null);
    try {
      const response = await fetch("/api/proxy/api/v1/reception/public-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, confirmationCode }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Ticket non généré");
      setTicket(payload);
      if (payload.printHtml) {
        const printWindow = window.open("", "_blank", "width=420,height=640");
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(payload.printHtml);
          printWindow.document.close();
        }
      }
    } catch (err: any) {
      setError(err?.message || "Impossible d’imprimer le ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_420px]">
        <section className="flex min-h-[70vh] flex-col justify-center">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center bg-blue-700 text-white">
              <TicketCheck className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-normal">Impression ticket patient</h1>
              <p className="mt-2 text-xl font-semibold text-slate-600">Scannez ou saisissez votre convocation.</p>
            </div>
          </div>

          <form onSubmit={submit} className="grid gap-5 border border-slate-200 bg-white p-8 shadow-sm">
            <label className="grid gap-2">
              <span className="text-sm font-black uppercase text-slate-500">Référence rendez-vous</span>
              <input
                value={appointmentId}
                onChange={(event) => setAppointmentId(event.target.value)}
                required
                autoFocus
                className="h-16 border border-slate-300 px-5 text-2xl font-black outline-none focus:border-blue-700"
                placeholder="Scanner QR ou saisir la référence"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-black uppercase text-slate-500">Code confirmation</span>
              <input
                value={confirmationCode}
                onChange={(event) => setConfirmationCode(event.target.value)}
                required
                className="h-16 border border-slate-300 px-5 text-2xl font-black outline-none focus:border-blue-700"
                placeholder="Ex. RDV-..."
              />
            </label>
            {error && <p className="border border-red-200 bg-red-50 px-4 py-3 text-lg font-bold text-red-700">{error}</p>}
            <button disabled={loading} className="flex h-16 items-center justify-center gap-3 bg-blue-700 px-6 text-xl font-black text-white disabled:opacity-60">
              <Printer className="h-6 w-6" />
              {loading ? "Impression..." : "Imprimer mon ticket"}
            </button>
          </form>
        </section>

        <aside className="flex min-h-[70vh] flex-col justify-center border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-black uppercase text-slate-500">Votre ticket</p>
          <div className="mt-6 flex min-h-64 flex-col items-center justify-center border border-dashed border-slate-300">
            {ticket ? (
              <>
                <p className="text-7xl font-black text-blue-700">{ticket.ticketNumber}</p>
                <p className="mt-4 text-center text-xl font-bold text-slate-700">{ticket.practitionerLabel || "Salle d’attente"}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">Surveillez l’écran d’appel.</p>
              </>
            ) : (
              <p className="px-8 text-center text-lg font-semibold text-slate-500">Le ticket s’affichera ici après validation.</p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
