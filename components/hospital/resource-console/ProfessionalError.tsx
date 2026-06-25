"use client";

import { AlertCircle } from "lucide-react";

export function ProfessionalError({ message }: { message: string }) {
  const isMissingApp = message.toLowerCase().includes("application not found");
  return (
    <div className="mb-6 border border-rose-200 bg-white p-5">
      <div className="flex gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center bg-rose-50 text-rose-600">
          <AlertCircle className="size-5" />
        </div>
        <div>
          <h2 className="font-black text-slate-950">Connexion au serveur indisponible</h2>
          <p className="mt-1 text-sm text-slate-600">{isMissingApp ? "L’adresse du backend configurée dans le front ne correspond pas à une application Railway active." : message}</p>
          {isMissingApp && <p className="mt-2 text-xs font-semibold text-slate-500">Corriger NEXT_PUBLIC_API_BASE_URL / HOSPITAL_API_URL avec l’URL réelle du service API.</p>}
        </div>
      </div>
    </div>
  );
}
