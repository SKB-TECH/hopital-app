"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { api } from "@/shared/lib/http/api";
import { hospitalText } from "@/shared/config/hospital-i18n";
import { PatientRecordHeader } from "@/components/hospital/patient-record/PatientRecordHeader";
import { PatientRecordSummary } from "@/components/hospital/patient-record/PatientRecordSummary";
import { PatientRecordTable } from "@/components/hospital/patient-record/PatientRecordTable";
import { normalizeRows, patientFullName } from "@/components/hospital/patient-record/helpers";
import { patientRecordSections } from "@/components/hospital/patient-record/sections";
import type { PatientRecordSectionKey } from "@/components/hospital/patient-record/types";

const patientRelatedEndpoints = {
  consultations: "/consultations",
  prescriptions: "/prescriptions",
  admissions: "/admissions",
  labOrders: "/laboratory/orders",
  imaging: "/imaging/orders",
  documents: "/emr/documents",
  invoices: "/billing/invoices",
};

export default function PatientRecordPage() {
  const params = useParams<{ locale: string; id: string }>();
  const { isCollapsed } = useSidebar();
  const locale = params.locale || "fr";
  const [active, setActive] = useState<PatientRecordSectionKey>("summary");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<Record<string, any>>({});

  useEffect(() => {
    void loadPatientRecord(params.id, locale).then(setData).catch((err) => setError(readPatientRecordError(err, locale))).finally(() => setLoading(false));
  }, [locale, params.id]);

  const patient = data.patient;
  const fullName = patientFullName(patient);
  const sections = patientRecordSections.map((section) => ({ ...section, label: hospitalText(section.label, locale) }));
  const rows = useMemo(() => ({
    consultations: data.consultations ?? [],
    admissions: data.admissions ?? [],
    lab: data.labOrders ?? [],
    imaging: data.imaging ?? [],
    documents: data.documents ?? [],
    billing: data.invoices ?? [],
  }), [data]);

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar />
      <div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-[84px]" : "lg:ml-[340px]"}`}>
        <DashboardNavbar />
        <main className="p-5 lg:p-8">
          <PatientRecordHeader locale={locale} fullName={fullName} medicalRecordNumber={patient?.medicalRecordNumber} />
          {error && <div className="mb-6 border border-rose-200 bg-white p-4 text-sm font-bold text-rose-700">{String(error)}</div>}
          {loading ? (
            <div className="border border-slate-200 bg-white p-16 text-center text-slate-500">
              <Loader2 className="mx-auto mb-3 size-6 animate-spin" />
              {locale === "en" ? "Loading record..." : "Chargement du dossier..."}
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
              <PatientRecordNavigation active={active} sections={sections} locale={locale} fullName={fullName} phone={patient?.phone} onChange={setActive} />
              <section className="border border-slate-200 bg-white p-6">
                {active === "summary" ? (
                  <PatientRecordSummary patient={patient} data={data} locale={locale} />
                ) : (
                  <PatientRecordTable title={sections.find((section) => section.key === active)?.label || ""} rows={(rows as any)[active] ?? []} billing={active === "billing"} locale={locale} />
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function PatientRecordNavigation({ active, sections, locale, fullName, phone, onChange }: { active: PatientRecordSectionKey; sections: typeof patientRecordSections; locale: string; fullName: string; phone?: string; onChange: (section: PatientRecordSectionKey) => void }) {
  return (
    <aside className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-black uppercase tracking-wide text-blue-700">Patient</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">{fullName}</h2>
        <p className="mt-1 text-sm text-slate-500">{phone || (locale === "en" ? "Phone not provided" : "Téléphone non renseigné")}</p>
      </div>
      <nav className="p-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button key={section.key} onClick={() => onChange(section.key)} className={`mb-1 flex w-full items-center gap-3 border-l-4 px-4 py-3 text-left text-sm font-black ${active === section.key ? "border-blue-700 bg-blue-50 text-blue-800" : "border-transparent text-slate-700 hover:bg-slate-50"}`}>
              <Icon className="size-5" />
              {section.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

async function loadPatientRecord(patientId: string, locale: string) {
  const patient = await api.get(`/patients/${patientId}`);
  const entries = await Promise.all(Object.entries(patientRelatedEndpoints).map(async ([key, endpoint]) => {
    try {
      const response = await api.get(endpoint);
      return [key, normalizeRows(response.data).filter((row) => row.patientId === patientId)];
    } catch {
      return [key, []];
    }
  }));
  return { patient: patient.data, ...Object.fromEntries(entries) };
}

function readPatientRecordError(err: any, locale: string) {
  return err?.response?.data?.message ?? err?.message ?? (locale === "en" ? "Patient record unavailable" : "Dossier patient indisponible");
}
