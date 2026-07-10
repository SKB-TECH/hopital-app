"use client";

import { hospitalText } from "@/shared/config/hospital-i18n";
import { formatPatientValue } from "./helpers";

export function PatientRecordSummary({ patient, data, locale = "fr" }: { patient: any; data: any; locale?: string }) {
  return (
    <div>
      <h2 className="mb-5 text-2xl font-black text-slate-950">
        {locale === "en" ? "Clinical and administrative summary" : "Synthèse clinique et administrative"}
      </h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Info label={hospitalText("Nom", locale)} value={[patient?.firstName, patient?.lastName].filter(Boolean).join(" ")} />
        <Info label={hospitalText("Genre", locale)} value={patient?.gender} />
        <Info label={hospitalText("Naissance", locale)} value={patient?.dateOfBirth} />
        <Info label={hospitalText("Groupe sanguin", locale)} value={patient?.bloodGroup} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Info label={hospitalText("Consultations", locale)} value={(data.consultations ?? []).length} />
        <Info label={hospitalText("Hospitalisations", locale)} value={(data.admissions ?? []).length} />
        <Info label={locale === "en" ? "Lab tests" : "Examens labo"} value={(data.labOrders ?? []).length} />
        <Info label={hospitalText("Factures", locale)} value={(data.invoices ?? []).length} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Info label={locale === "en" ? "Allergies" : "Allergies"} value={formatPatientValue(patient?.allergies)} />
        <Info label={locale === "en" ? "Address" : "Adresse"} value={formatPatientValue(patient?.address)} />
        <Info label={locale === "en" ? "Emergency contact" : "Contact urgence"} value={formatPatientValue(patient?.emergencyContact)} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-950">{value || "-"}</p>
    </div>
  );
}
