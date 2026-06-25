import { Bed, FileText, FlaskConical, Microscope, Receipt, Stethoscope, UserRound } from "lucide-react";
import type { PatientRecordSectionKey } from "./types";

export const patientRecordSections: Array<{ key: PatientRecordSectionKey; label: string; icon: any }> = [
  { key: "summary", label: "Synthèse", icon: UserRound },
  { key: "consultations", label: "Consultations", icon: Stethoscope },
  { key: "admissions", label: "Hospitalisations", icon: Bed },
  { key: "lab", label: "Laboratoire", icon: FlaskConical },
  { key: "imaging", label: "Imagerie", icon: Microscope },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "billing", label: "Facturation", icon: Receipt },
];
