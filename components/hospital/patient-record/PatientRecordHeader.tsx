"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { hospitalText } from "@/shared/config/hospital-i18n";

export function PatientRecordHeader({ locale, patientId, fullName, medicalRecordNumber }: { locale: string; patientId?: string; fullName: string; medicalRecordNumber?: string }) {
  return (
    <div className="mb-6 flex items-center justify-between border border-slate-200 bg-white px-6 py-5">
      <div className="flex items-center gap-4">
        <a href={`/${locale}/hospital/patients`} className="border border-slate-300 p-2 hover:bg-slate-50" aria-label={locale === "en" ? "Back" : "Retour"}>
          <ArrowLeft className="size-5" />
        </a>
        <div>
          <h1 className="text-3xl font-black text-slate-950">{hospitalText("Dossier patient", locale)}</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {fullName} {medicalRecordNumber ? `— ${medicalRecordNumber}` : ""}
          </p>
        </div>
      </div>
      <button onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-black text-slate-800 hover:bg-slate-50">
        <Printer className="size-4" />
        {locale === "en" ? "Print" : "Imprimer"}
      </button>
    </div>
  );
}
