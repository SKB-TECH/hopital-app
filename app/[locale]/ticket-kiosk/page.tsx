"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BellRing, CalendarCheck, CreditCard, Printer, Search, TicketCheck, UserPlus } from "lucide-react";
import { api } from "@/shared/lib/http/api";

type Patient = { id: string; firstName?: string; lastName?: string; medicalRecordNumber?: string; phone?: string };
type Appointment = { id: string; patientName?: string; medicalRecordNumber?: string; practitionerName?: string; scheduledAt?: string };
type Ticket = { id?: string; queueNumber?: string; ticketNumber?: string; patientName?: string; medicalRecordNumber?: string; checkedInAt?: string; printHtml?: string };
type Option = { id: string; label: string; description?: string };

const storageKey = "afia.reception.ticketDesk";
const defaultServices: Option[] = [
  { id: "ORIENTATION", label: "Orientation générale", description: "Accueil, tri et orientation vers le bon service" },
  { id: "CONSULTATION_GENERAL", label: "Consultation générale", description: "Médecine générale ou premier avis clinique" },
  { id: "PEDIATRICS", label: "Pédiatrie", description: "Consultation enfant et suivi pédiatrique" },
  { id: "MATERNITY", label: "Maternité / Gynécologie", description: "Grossesse, gynécologie et salle de naissance" },
  { id: "SURGERY", label: "Chirurgie", description: "Avis chirurgical, pansement ou bloc opératoire" },
  { id: "EMERGENCY", label: "Urgences", description: "Cas aigu ou patient à prioriser" },
  { id: "LABORATORY", label: "Laboratoire", description: "Prélèvements et examens biologiques" },
  { id: "IMAGING", label: "Imagerie", description: "Radiologie, échographie ou autres examens" },
  { id: "PHARMACY", label: "Pharmacie", description: "Délivrance de médicaments" },
  { id: "BILLING", label: "Caisse / Facturation", description: "Paiement, facture ou régularisation" },
  { id: "ADMISSION", label: "Hospitalisation", description: "Admission, lit ou dossier de séjour" },
];

export default function TicketKioskPage() {
  const [mode, setMode] = useState<"walkin" | "appointment">("walkin");
  const [facilityId, setFacilityId] = useState("");
  const [service, setService] = useState("ORIENTATION");
  const [practitionerId, setPractitionerId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [dossierFeePaid, setDossierFeePaid] = useState(true);
  const [paymentReference, setPaymentReference] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [recent, setRecent] = useState<Ticket[]>([]);
  const [facilities, setFacilities] = useState<Option[]>([]);
  const [services, setServices] = useState<Option[]>(defaultServices);
  const [practitioners, setPractitioners] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      setFacilityId(parsed.facilityId || "");
      setService(parsed.service || "ORIENTATION");
      setPractitionerId(parsed.practitionerId || "");
    }
    void loadOptions();
    void loadRecent();
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ facilityId, service, practitionerId }));
  }, [facilityId, service, practitionerId]);

  useEffect(() => {
    const timer = setTimeout(() => void searchPatients(), 250);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  useEffect(() => {
    const timer = setTimeout(() => void searchAppointments(), 250);
    return () => clearTimeout(timer);
  }, [appointmentSearch]);

  async function loadOptions() {
    const response = await api.get("/reception/options").catch(() => null);
    setFacilities(response?.data?.facilities || []);
    setServices(response?.data?.services?.length ? response.data.services : defaultServices);
    setPractitioners(response?.data?.practitioners || []);
    if (!facilityId && response?.data?.facilities?.[0]?.id) setFacilityId(response.data.facilities[0].id);
  }

  async function loadRecent() {
    const response = await api.get("/reception/walk-in-ticket", { params: { page: 1, limit: 6 } }).catch(() => null);
    setRecent(response?.data?.data || []);
  }

  async function searchPatients() {
    if (patientSearch.trim().length < 2) return setPatients([]);
    const response = await api.get("/patients", { params: { search: patientSearch, page: 1, limit: 8 } }).catch(() => null);
    setPatients(response?.data?.data || []);
  }

  async function searchAppointments() {
    if (appointmentSearch.trim().length < 2) return setAppointments([]);
    const response = await api.get("/appointments/book", { params: { search: appointmentSearch, page: 1, limit: 8 } }).catch(() => null);
    setAppointments(response?.data?.data || []);
  }

  function printTicket(current: Ticket) {
    const number = current.ticketNumber || current.queueNumber || "-";
    const html = current.printHtml || `<html><body style="font-family:Arial;text-align:center;padding:24px"><h1 style="font-size:64px;margin:0">${number}</h1><p>Salle d'attente</p><p>${new Date().toLocaleString("fr-FR")}</p><script>window.print()</script></body></html>`;
    const printWindow = window.open("", "_blank", "width=420,height=640");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      let payload: Ticket;
      if (mode === "walkin") {
        if (!patient?.id) throw new Error("Sélectionnez le patient.");
        const response = await api.post("/reception/walk-in-ticket", {
          patientId: patient.id,
          facilityId: facilityId || undefined,
          practitionerId: practitionerId || undefined,
          service,
          admissionType: "AMBULATORY",
          triagePriority: 3,
          dossierFeePaid,
          paymentReference: paymentReference || undefined,
        });
        payload = response.data;
      } else {
        if (!appointment?.id) throw new Error("Sélectionnez le rendez-vous.");
        const response = await api.post("/reception/check-in", { appointmentId: appointment.id, admissionType: "AMBULATORY", triagePriority: 3 });
        payload = response.data;
      }
      setTicket(payload);
      printTicket(payload);
      await loadRecent();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Impossible de générer le ticket.");
    } finally {
      setLoading(false);
    }
  }

  const selectedLabel = useMemo(() => {
    if (mode === "walkin" && patient) return `${patient.firstName || ""} ${patient.lastName || ""} · ${patient.medicalRecordNumber || ""}`;
    if (mode === "appointment" && appointment) return `${appointment.patientName || ""} · ${appointment.medicalRecordNumber || ""}`;
    return "Sélectionnez un patient";
  }, [mode, patient, appointment]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center bg-blue-700 text-white">
              <TicketCheck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-normal">Réception tickets</h1>
              <p className="text-sm font-bold text-slate-500">Patient, paiement dossier, destination et impression.</p>
            </div>
          </div>
          <a href="/fr/waiting-room/display" target="_blank" className="inline-flex h-12 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-700">
            <BellRing className="h-5 w-5" />
            Ouvrir écran TV
          </a>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 p-8 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-5">
          <div className="grid gap-4 border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_1.2fr_1.2fr]">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase text-slate-500">Site</span>
              <select value={facilityId} onChange={(event) => setFacilityId(event.target.value)} className="h-14 border border-slate-300 bg-white px-4 text-lg font-black outline-none focus:border-blue-700">
                <option value="">Site principal</option>
                {facilities.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase text-slate-500">Service / motif</span>
              <select value={service} onChange={(event) => setService(event.target.value)} className="h-14 border border-slate-300 bg-white px-4 text-lg font-black outline-none focus:border-blue-700">
                {services.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase text-slate-500">Médecin précis</span>
              <select value={practitionerId} onChange={(event) => setPractitionerId(event.target.value)} className="h-14 border border-slate-300 bg-white px-4 text-lg font-black outline-none focus:border-blue-700">
                <option value="">Sans médecin précis</option>
                {practitioners.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 border border-slate-200 bg-white p-2 shadow-sm">
            <button type="button" onClick={() => setMode("walkin")} className={`flex h-14 items-center justify-center gap-2 text-base font-black ${mode === "walkin" ? "bg-blue-700 text-white" : "text-slate-600"}`}>
              <UserPlus className="h-5 w-5" />
              Sans rendez-vous
            </button>
            <button type="button" onClick={() => setMode("appointment")} className={`flex h-14 items-center justify-center gap-2 text-base font-black ${mode === "appointment" ? "bg-blue-700 text-white" : "text-slate-600"}`}>
              <CalendarCheck className="h-5 w-5" />
              Avec rendez-vous
            </button>
          </div>

          <form onSubmit={submit} className="grid gap-5 border border-slate-200 bg-white p-6 shadow-sm">
            {mode === "walkin" ? (
              <>
                <div className="grid gap-3">
                  <div className="flex items-end justify-between gap-4">
                    <label className="grid flex-1 gap-2">
                      <span className="text-xs font-black uppercase text-slate-500">Patient</span>
                      <div className="flex h-16 items-center border border-slate-300 px-4 focus-within:border-blue-700">
                        <Search className="mr-3 h-6 w-6 text-slate-400" />
                        <input value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} autoFocus className="h-full flex-1 text-xl font-black outline-none" placeholder="Nom, téléphone ou MRN" />
                      </div>
                    </label>
                    <a href="/fr/hospital/patients" className="flex h-16 items-center border border-slate-300 bg-slate-50 px-5 text-sm font-black text-slate-700">
                      Créer dossier
                    </a>
                  </div>
                  {!!patients.length && (
                    <div className="grid gap-2">
                      {patients.map((item) => (
                        <button key={item.id} type="button" onClick={() => setPatient(item)} className={`border px-4 py-4 text-left text-lg font-black ${patient?.id === item.id ? "border-blue-700 bg-blue-50 text-blue-800" : "border-slate-200 hover:bg-slate-50"}`}>
                          {item.firstName} {item.lastName} · {item.medicalRecordNumber} {item.phone ? `· ${item.phone}` : ""}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-3 border border-slate-200 bg-slate-50 p-4 md:grid-cols-[240px_1fr]">
                  <label className="flex items-center gap-3 text-lg font-black text-slate-700">
                    <input type="checkbox" checked={dossierFeePaid} onChange={(event) => setDossierFeePaid(event.target.checked)} className="h-6 w-6" />
                    Frais dossier payé
                  </label>
                  <input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} className="h-14 border border-slate-300 px-4 text-lg font-bold outline-none focus:border-blue-700" placeholder="Référence paiement caisse" />
                </div>
              </>
            ) : (
              <div className="grid gap-3">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase text-slate-500">Rendez-vous</span>
                  <div className="flex h-16 items-center border border-slate-300 px-4 focus-within:border-blue-700">
                    <Search className="mr-3 h-6 w-6 text-slate-400" />
                    <input value={appointmentSearch} onChange={(event) => setAppointmentSearch(event.target.value)} autoFocus className="h-full flex-1 text-xl font-black outline-none" placeholder="Patient, MRN, médecin ou code" />
                  </div>
                </label>
                {!!appointments.length && (
                  <div className="grid gap-2">
                    {appointments.map((item) => (
                      <button key={item.id} type="button" onClick={() => setAppointment(item)} className={`border px-4 py-4 text-left font-black ${appointment?.id === item.id ? "border-blue-700 bg-blue-50 text-blue-800" : "border-slate-200 hover:bg-slate-50"}`}>
                        {item.patientName} · {item.medicalRecordNumber} · {item.practitionerName} · {item.scheduledAt ? new Date(item.scheduledAt).toLocaleString("fr-FR") : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase text-blue-700">Patient sélectionné</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{selectedLabel}</p>
            </div>

            {error && <p className="border border-red-200 bg-red-50 px-4 py-3 text-base font-bold text-red-700">{error}</p>}
            <button disabled={loading} className="flex h-16 items-center justify-center gap-3 bg-blue-700 px-6 text-xl font-black text-white disabled:opacity-60">
              <Printer className="h-6 w-6" />
              {loading ? "Impression..." : "Créer et imprimer le ticket"}
            </button>
          </form>
        </section>

        <aside className="grid content-start gap-5">
          <div className="border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-blue-700" />
              <h2 className="text-lg font-black">Dernier ticket</h2>
            </div>
            <div className="flex min-h-52 flex-col items-center justify-center border border-dashed border-slate-300 bg-slate-50">
              {ticket ? (
                <>
                  <p className="text-7xl font-black text-blue-700">{ticket.ticketNumber || ticket.queueNumber}</p>
                  <p className="mt-3 text-center text-lg font-black">{ticket.patientName}</p>
                  <button onClick={() => printTicket(ticket)} className="mt-5 border border-slate-300 bg-white px-4 py-2 text-sm font-black">Réimprimer</button>
                </>
              ) : (
                <p className="px-6 text-center text-sm font-bold text-slate-500">Aucun ticket imprimé.</p>
              )}
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-black">Derniers tickets</h2>
            <div className="grid gap-3">
              {recent.slice(0, 5).map((item) => (
                <div key={item.id || item.queueNumber} className="border border-slate-200 p-3">
                  <p className="font-black text-blue-700">{item.queueNumber}</p>
                  <p className="text-sm font-bold text-slate-700">{item.patientName}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
