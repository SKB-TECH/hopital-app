"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Bed, FileText, FlaskConical, Loader2, Microscope, Printer, Receipt, Stethoscope, UserRound } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { api } from "@/shared/lib/http/api";

type SectionKey = "summary" | "consultations" | "admissions" | "lab" | "imaging" | "documents" | "billing";

const sections: Array<{ key: SectionKey; label: string; icon: any }> = [
  { key: "summary", label: "Synthèse", icon: UserRound },
  { key: "consultations", label: "Consultations", icon: Stethoscope },
  { key: "admissions", label: "Hospitalisations", icon: Bed },
  { key: "lab", label: "Laboratoire", icon: FlaskConical },
  { key: "imaging", label: "Imagerie", icon: Microscope },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "billing", label: "Facturation", icon: Receipt },
];

export default function PatientRecordPage() {
  const params = useParams<{ locale: string; id: string }>();
  const { isCollapsed } = useSidebar();
  const [active, setActive] = useState<SectionKey>("summary");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<Record<string, any>>({});

  const load = async () => {
    setLoading(true); setError("");
    try {
      const patient = await api.get(`/patients/${params.id}`);
      const endpoints = {
        consultations: "/consultations",
        prescriptions: "/prescriptions",
        admissions: "/admissions",
        labOrders: "/laboratory/orders",
        imaging: "/imaging/orders",
        documents: "/emr/documents",
        invoices: "/billing/invoices",
      };
      const entries = await Promise.all(Object.entries(endpoints).map(async ([key, endpoint]) => {
        try { const response = await api.get(endpoint); return [key, normalizeRows(response.data).filter((row) => row.patientId === params.id)]; }
        catch { return [key, []]; }
      }));
      setData({ patient: patient.data, ...Object.fromEntries(entries) });
    } catch (err: any) { setError(err?.response?.data?.message ?? err?.message ?? "Dossier patient indisponible"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [params.id]);

  const patient = data.patient;
  const fullName = [patient?.firstName, patient?.lastName].filter(Boolean).join(" ") || "Patient";
  const rows = useMemo(() => ({
    consultations: data.consultations ?? [],
    admissions: data.admissions ?? [],
    lab: data.labOrders ?? [],
    imaging: data.imaging ?? [],
    documents: data.documents ?? [],
    billing: data.invoices ?? [],
  }), [data]);

  return <div className="min-h-screen bg-slate-50"><DashboardSidebar /><div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-[84px]" : "lg:ml-[340px]"}`}><DashboardNavbar /><main className="p-5 lg:p-8">
    <div className="mb-6 flex items-center justify-between border border-slate-200 bg-white px-6 py-5">
      <div className="flex items-center gap-4"><a href={`/${params.locale}/hospital/patients`} className="border border-slate-300 p-2 hover:bg-slate-50"><ArrowLeft className="size-5" /></a><div><h1 className="text-3xl font-black text-slate-950">Dossier patient</h1><p className="mt-1 text-sm font-semibold text-slate-500">{fullName} {patient?.medicalRecordNumber ? `— ${patient.medicalRecordNumber}` : ""}</p></div></div>
      <button onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50"><Printer className="size-4" />Imprimer</button>
    </div>
    {error && <div className="mb-6 border border-rose-200 bg-white p-4 text-sm font-bold text-rose-700">{String(error)}</div>}
    {loading ? <div className="border border-slate-200 bg-white p-16 text-center text-slate-500"><Loader2 className="mx-auto mb-3 size-6 animate-spin" />Chargement du dossier...</div> : <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="border border-slate-200 bg-white"><div className="border-b border-slate-200 p-5"><p className="text-xs font-black uppercase tracking-wide text-blue-700">Patient</p><h2 className="mt-1 text-xl font-black text-slate-950">{fullName}</h2><p className="mt-1 text-sm text-slate-500">{patient?.phone || "Téléphone non renseigné"}</p></div><nav className="p-3">{sections.map((section) => { const Icon=section.icon; return <button key={section.key} onClick={() => setActive(section.key)} className={`mb-1 flex w-full items-center gap-3 border-l-4 px-4 py-3 text-left text-sm font-black ${active===section.key ? "border-blue-700 bg-blue-50 text-blue-800" : "border-transparent text-slate-700 hover:bg-slate-50"}`}><Icon className="size-5" />{section.label}</button>; })}</nav></aside>
      <section className="border border-slate-200 bg-white p-6">{active === "summary" ? <Summary patient={patient} data={data} /> : <RecordTable title={sections.find((s)=>s.key===active)?.label || ""} rows={(rows as any)[active] ?? []} billing={active === "billing"} />}</section>
    </div>}
  </main></div></div>;
}

function Summary({ patient, data }: any) {
  return <div><h2 className="mb-5 text-2xl font-black text-slate-950">Synthèse clinique et administrative</h2><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Info label="Nom" value={[patient?.firstName, patient?.lastName].filter(Boolean).join(" ")} /><Info label="Genre" value={patient?.gender} /><Info label="Naissance" value={patient?.dateOfBirth} /><Info label="Groupe sanguin" value={patient?.bloodGroup} /></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Info label="Consultations" value={(data.consultations ?? []).length} /><Info label="Hospitalisations" value={(data.admissions ?? []).length} /><Info label="Examens labo" value={(data.labOrders ?? []).length} /><Info label="Factures" value={(data.invoices ?? []).length} /></div><pre className="mt-6 max-h-80 overflow-auto border border-slate-200 bg-slate-50 p-4 text-xs">{JSON.stringify({ allergies: patient?.allergies, address: patient?.address, emergencyContact: patient?.emergencyContact }, null, 2)}</pre></div>;
}
function Info({ label, value }: { label: string; value: any }) { return <div className="border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-lg font-black text-slate-950">{value || "-"}</p></div>; }
function RecordTable({ title, rows, billing }: { title: string; rows: any[]; billing?: boolean }) { const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row)).filter((key) => !["organizationId", "deletedAt"].includes(key)))).slice(0, 7); return <div><h2 className="mb-5 text-2xl font-black text-slate-950">{title}</h2>{rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px]"><thead className="bg-slate-50"><tr>{columns.map((column)=><th key={column} className="border-b border-slate-200 px-4 py-3 text-left text-xs font-black uppercase text-slate-500">{column}</th>)}{billing && <th className="border-b border-slate-200 px-4 py-3 text-right text-xs font-black uppercase text-slate-500">Actions</th>}</tr></thead><tbody>{rows.map((row)=><tr key={row.id} className="border-t border-slate-100">{columns.map((column)=><td key={column} className="max-w-xs truncate px-4 py-3 text-sm font-semibold text-slate-700">{format(row[column])}</td>)}{billing && <td className="px-4 py-3 text-right"><button onClick={() => window.open(`/api/proxy/api/v1/billing/invoices/${row.id}/pdf`, "_blank")} className="border border-slate-300 px-3 py-2 text-xs font-black">PDF</button></td>}</tr>)}</tbody></table></div> : <p className="border border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">Aucune donnée.</p>}</div>; }
function normalizeRows(data: any): any[] { if (Array.isArray(data)) return data; if (Array.isArray(data?.data)) return data.data; if (Array.isArray(data?.items)) return data.items; return data && typeof data === "object" ? [data] : []; }
function format(value: any) { if (value === null || value === undefined || value === "") return "-"; if (typeof value === "object") return JSON.stringify(value); return String(value); }
