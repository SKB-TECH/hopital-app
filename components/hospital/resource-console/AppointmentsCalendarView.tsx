"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2, Mail, Plus, RefreshCcw, Stethoscope, UserRound, X } from "lucide-react";
import { api } from "@/shared/lib/http/api";
import { readError } from "./utils";
import { ProfessionalError } from "./ProfessionalError";

const WEEK_DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const WEEK_DAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AppointmentsCalendarView({ rows, loading, onRefresh, onCreate, locale = "fr" }: { rows: any[]; loading: boolean; onRefresh: () => void; onCreate: () => void; locale?: string }) {
  const [month, setMonth] = useState(monthKey(new Date()));
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [actionError, setActionError] = useState("");

  const calendarDays = useMemo(() => buildMonthDays(month), [month]);
  const weekDays = locale === "en" ? WEEK_DAYS_EN : WEEK_DAYS_FR;
  const visibleRows = useMemo(() => rows.filter((row) => dateKey(new Date(row.scheduledAt)).startsWith(month)), [month, rows]);
  const byDate = useMemo(() => groupAppointmentsByDate(visibleRows), [visibleRows]);
  const selectedRows = byDate[selectedDate] ?? [];
  const upcoming = visibleRows.filter((row) => new Date(row.scheduledAt).getTime() >= Date.now() && !["CANCELLED", "NO_SHOW", "MISSED"].includes(row.status)).slice(0, 8);
  const stats = appointmentStats(visibleRows);

  const shift = (delta: number) => setMonth(shiftMonth(month, delta));
  const today = () => {
    const now = new Date();
    setMonth(monthKey(now));
    setSelectedDate(dateKey(now));
  };
  const selectAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setReminderEmail(appointment.patientEmail ?? "");
  };
  const updateStatus = async (appointment: any, status: string) => {
    setActionError("");
    try {
      await api.patch(`/appointments/${appointment.id}/status`, { status });
      setSelectedAppointment(null);
      await onRefresh();
    } catch (err: any) {
      setActionError(readError(err));
    }
  };
  const sendReminder = async (appointment: any) => {
    setSendingReminder(true);
    setActionError("");
    try {
      await api.post(`/appointments/${appointment.id}/reminder/email`, { to: reminderEmail || undefined, message: reminderMessage || undefined });
      setReminderEmail("");
      setReminderMessage("");
    } catch (err: any) {
      setActionError(readError(err));
    } finally {
      setSendingReminder(false);
    }
  };

  return (
    <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-950">{formatMonth(month, locale)}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{locale === "en" ? "Medical calendar filtered by your permissions. Doctors only see their own appointments." : "Agenda médical filtré selon vos droits. Le médecin voit uniquement ses propres rendez-vous."}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-blue-700" />
            <button onClick={() => shift(-1)} className="flex size-10 items-center justify-center border border-slate-300 hover:bg-slate-50"><ChevronLeft className="size-4" /></button>
            <button onClick={today} className="h-10 border border-slate-300 px-4 text-sm font-black hover:bg-slate-50">{locale === "en" ? "Today" : "Aujourd’hui"}</button>
            <button onClick={() => shift(1)} className="flex size-10 items-center justify-center border border-slate-300 hover:bg-slate-50"><ChevronRight className="size-4" /></button>
            <button onClick={onRefresh} className="flex size-10 items-center justify-center border border-slate-300 hover:bg-slate-50"><RefreshCcw className="size-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50">
          <AppointmentStat label={locale === "en" ? "Month total" : "Total mois"} value={visibleRows.length} />
          <AppointmentStat label={locale === "en" ? "Today" : "Aujourd’hui"} value={stats.today} />
          <AppointmentStat label={locale === "en" ? "Confirmed" : "Confirmés"} value={stats.confirmed} />
          <AppointmentStat label={locale === "en" ? "Pending" : "En attente"} value={stats.pending} />
        </div>

        <div className="overflow-x-auto p-5">
          <div className="min-w-[820px]">
            <div className="grid grid-cols-7 border border-slate-200">
              {weekDays.map((day) => <div key={day} className="border-r border-slate-200 bg-slate-50 p-3 text-center text-sm font-black text-slate-500 last:border-r-0">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 border border-t-0 border-slate-200">
              {calendarDays.map((day) => {
                const dayRows = byDate[day.fullDate] ?? [];
                return (
                  <div key={day.fullDate} className={`min-h-[132px] border-r border-t border-slate-200 p-2 last:border-r-0 ${day.inMonth ? "bg-white" : "bg-slate-50/80"}`}>
                    <button onClick={() => setSelectedDate(day.fullDate)} className={`mb-2 inline-flex size-7 items-center justify-center text-xs font-black ${selectedDate === day.fullDate ? "bg-blue-700 text-white" : day.inMonth ? "text-slate-700 hover:bg-slate-100" : "text-slate-400"}`}>{day.date}</button>
                    <div className="space-y-1">
                      {loading && !dayRows.length ? <div className="h-7 bg-slate-100" /> : dayRows.slice(0, 3).map((appointment) => <button key={appointment.id} onClick={() => selectAppointment(appointment)} className={`w-full truncate px-2 py-1.5 text-left text-xs font-black ${appointmentColor(appointment.status)}`}>{formatTime(new Date(appointment.scheduledAt))} · {appointment.patientFirstName} {appointment.patientLastName}</button>)}
                      {dayRows.length > 3 && <p className="text-xs font-black text-slate-400">+{dayRows.length - 3}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-lg font-black text-slate-950">{locale === "en" ? "Appointments for" : "Rendez-vous du"} {formatDateLabel(selectedDate, locale)}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{selectedRows.length} {locale === "en" ? "appointment(s)" : "rendez-vous"}</p>
          </div>
          <div className="divide-y divide-slate-100">
            {selectedRows.length ? selectedRows.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} onClick={() => selectAppointment(appointment)} />) : <div className="p-8 text-center text-sm font-semibold text-slate-400"><CalendarDays className="mx-auto mb-3 size-10 text-slate-300" />{locale === "en" ? "No appointment this day." : "Aucun rendez-vous ce jour."}</div>}
          </div>
        </section>

        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-lg font-black text-slate-950">{locale === "en" ? "Upcoming appointments" : "Prochains rendez-vous"}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{locale === "en" ? "Priority list for the month." : "Liste prioritaire du mois."}</p>
          </div>
          <div className="divide-y divide-slate-100">{upcoming.length ? upcoming.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} compact onClick={() => selectAppointment(appointment)} />) : <div className="p-6 text-sm font-semibold text-slate-400">{locale === "en" ? "No upcoming appointment." : "Aucun prochain rendez-vous."}</div>}</div>
        </section>

        <button onClick={onCreate} className="flex h-12 w-full items-center justify-center gap-2 bg-blue-700 px-5 text-sm font-black text-white hover:bg-blue-800"><Plus className="size-4" />{locale === "en" ? "New appointment" : "Nouveau rendez-vous"}</button>
      </aside>

      {selectedAppointment && (
        <AppointmentDetailsDialog
          appointment={selectedAppointment}
          locale={locale}
          actionError={actionError}
          reminderEmail={reminderEmail}
          reminderMessage={reminderMessage}
          sendingReminder={sendingReminder}
          onClose={() => setSelectedAppointment(null)}
          onReminderEmailChange={setReminderEmail}
          onReminderMessageChange={setReminderMessage}
          onSendReminder={() => sendReminder(selectedAppointment)}
          onUpdateStatus={(status: string) => updateStatus(selectedAppointment, status)}
        />
      )}
    </div>
  );
}

function AppointmentDetailsDialog({ appointment, locale, actionError, reminderEmail, reminderMessage, sendingReminder, onClose, onReminderEmailChange, onReminderMessageChange, onSendReminder, onUpdateStatus }: any) {
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-2xl border border-slate-300 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div><h3 className="text-xl font-black text-slate-950">{locale === "en" ? "Appointment details" : "Détail rendez-vous"}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{appointment.patientFirstName} {appointment.patientLastName}</p></div>
          <button onClick={onClose} className="border border-slate-300 p-2"><X className="size-5" /></button>
        </div>
        <div className="space-y-5 p-6">
          {actionError && <ProfessionalError message={actionError} />}
          <div className="grid gap-4 md:grid-cols-2">
            <DetailBox icon={<CalendarDays className="size-5" />} label="Date" value={formatFullDateTime(appointment.scheduledAt, locale)} />
            <DetailBox icon={<Clock className="size-5" />} label={locale === "en" ? "Duration" : "Durée"} value={`${appointment.durationMinutes ?? 30} minutes`} />
            <DetailBox icon={<UserRound className="size-5" />} label="Patient" value={`${appointment.patientFirstName} ${appointment.patientLastName} · ${appointment.medicalRecordNumber ?? "-"}`} />
            <DetailBox icon={<Stethoscope className="size-5" />} label={locale === "en" ? "Doctor" : "Médecin"} value={`Dr ${appointment.doctorFirstName ?? ""} ${appointment.doctorLastName ?? ""}`} />
          </div>
          <div className="border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">{locale === "en" ? "Reason" : "Motif"}</p><p className="mt-2 text-sm font-semibold text-slate-800">{appointment.reason || appointment.notes || "-"}</p></div>
          <div className="grid gap-3 md:grid-cols-3">
            <button onClick={() => onUpdateStatus("CONFIRMED")} className="h-11 border border-emerald-300 bg-emerald-50 text-sm font-black text-emerald-800">{locale === "en" ? "Confirm" : "Confirmer"}</button>
            <button onClick={() => onUpdateStatus("CHECKED_IN")} className="h-11 border border-blue-300 bg-blue-50 text-sm font-black text-blue-800">{locale === "en" ? "Patient arrived" : "Patient arrivé"}</button>
            <button onClick={() => onUpdateStatus("CANCELLED")} className="h-11 border border-rose-300 bg-rose-50 text-sm font-black text-rose-800">{locale === "en" ? "Cancel" : "Annuler"}</button>
          </div>
          <div className="border border-slate-200 p-4">
            <h4 className="font-black text-slate-950">{locale === "en" ? "Email reminder" : "Rappel email"}</h4>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <TextField label={locale === "en" ? "Patient email" : "Email patient"} value={reminderEmail} onChange={onReminderEmailChange} />
              <TextField label={locale === "en" ? "Short message" : "Message court"} value={reminderMessage} onChange={onReminderMessageChange} />
            </div>
            <button onClick={onSendReminder} disabled={sendingReminder} className="mt-4 inline-flex h-11 items-center gap-2 bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-50">{sendingReminder ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}{locale === "en" ? "Send reminder" : "Envoyer rappel"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppointmentStat({ label, value }: { label: string; value: number }) { return <div className="border-r border-slate-200 p-4 last:border-r-0"><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-950">{value}</p></div>; }
function AppointmentCard({ appointment, compact, onClick }: { appointment: any; compact?: boolean; onClick: () => void }) { return <button onClick={onClick} className="w-full p-4 text-left hover:bg-slate-50"><div className="border-l-4 border-blue-700 pl-3"><div className="flex items-start justify-between gap-3"><h4 className="line-clamp-1 text-sm font-black text-slate-950">{appointment.patientFirstName} {appointment.patientLastName}</h4><span className={`shrink-0 px-2 py-0.5 text-[11px] font-black ${appointmentColor(appointment.status)}`}>{appointment.status}</span></div><p className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500"><Clock className="size-3.5" />{formatTime(new Date(appointment.scheduledAt))} · {appointment.type}</p>{!compact && <p className="mt-1 text-xs font-semibold text-slate-500">Dr {appointment.doctorFirstName} {appointment.doctorLastName}</p>}</div></button>; }
function DetailBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="border border-slate-200 bg-slate-50 p-4"><div className="mb-2 text-blue-700">{icon}</div><p className="text-xs font-black uppercase text-slate-500">{label}</p><p className="mt-1 text-sm font-black text-slate-900">{value}</p></div>; }
function TextField({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (value: any) => void; type?: string }) { return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span><input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white" /></label>; }
function groupAppointmentsByDate(rows: any[]) { return rows.reduce<Record<string, any[]>>((acc, row) => { const key = dateKey(new Date(row.scheduledAt)); acc[key] = [...(acc[key] ?? []), row].sort((a, b) => String(a.scheduledAt).localeCompare(String(b.scheduledAt))); return acc; }, {}); }
function appointmentColor(status: string) { if (["CANCELLED", "NO_SHOW", "MISSED"].includes(status)) return "bg-rose-50 text-rose-700"; if (["CONFIRMED", "CHECKED_IN", "IN_PROGRESS"].includes(status)) return "bg-emerald-50 text-emerald-700"; if (status === "COMPLETED") return "bg-slate-100 text-slate-700"; return "bg-blue-50 text-blue-700"; }
function appointmentStats(rows: any[]) { const today = dateKey(new Date()); return { today: rows.filter((row) => dateKey(new Date(row.scheduledAt)) === today).length, confirmed: rows.filter((row) => ["CONFIRMED", "CHECKED_IN", "IN_PROGRESS"].includes(row.status)).length, pending: rows.filter((row) => ["REQUESTED", "SCHEDULED"].includes(row.status)).length }; }
function monthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function shiftMonth(month: string, delta: number) { const [year, value] = month.split("-").map(Number); const date = new Date(year, value - 1 + delta, 1); return monthKey(date); }
function buildMonthDays(month: string) { const [year, monthNumber] = month.split("-").map(Number); const firstDay = new Date(year, monthNumber - 1, 1); const startOffset = (firstDay.getDay() + 6) % 7; const startDate = new Date(year, monthNumber - 1, 1 - startOffset); return Array.from({ length: 42 }).map((_, index) => { const day = new Date(startDate); day.setDate(startDate.getDate() + index); return { date: day.getDate(), fullDate: dateKey(day), inMonth: day.getMonth() === monthNumber - 1 }; }); }
function localeTag(locale = "fr") { return locale === "en" ? "en-US" : "fr-FR"; }
function formatMonth(month: string, locale = "fr") { const [year, value] = month.split("-").map(Number); return new Intl.DateTimeFormat(localeTag(locale), { month: "long", year: "numeric" }).format(new Date(year, value - 1, 1)); }
function formatDateLabel(value: string, locale = "fr") { return new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium" }).format(new Date(value)); }
function formatTime(date: Date) { return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date); }
function formatFullDateTime(value: string, locale = "fr") { const date = new Date(value); return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "full", timeStyle: "short" }).format(date); }
