"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Eye, Loader2, Mail, Printer, X } from "lucide-react";
import { printService, type PrintTemplate } from "@/shared/services/print.service";
import { readError } from "./utils";
import { categoryFromModule, pickDefaultTemplate } from "./print-utils";
import { ProfessionalError } from "./ProfessionalError";
import { TextAreaField, TextField } from "./ResourceFields";

export function PrintDialog({ moduleEndpoint, moduleTitle, locale, row, onClose }: { moduleEndpoint: string; moduleTitle: string; locale: "fr" | "en"; row?: any; onClose: () => void }) {
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("generic-record");
  const [watermark, setWatermark] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState<"" | "preview" | "download" | "print" | "email">("");
  const [error, setError] = useState("");
  const moduleKey = moduleEndpoint.replace(/^\//, "");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    printService.templates()
      .then((response) => {
        if (!mounted) return;
        const list = response.templates ?? [];
        setTemplates(list);
        setSelectedTemplate(pickDefaultTemplate(list, moduleKey));
      })
      .catch((err) => mounted && setError(readError(err)))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [moduleKey]);

  const relevantTemplates = useMemo(() => {
    const category = categoryFromModule(moduleKey);
    const filtered = templates.filter((template) => template.defaultModule === moduleKey || template.category === category || template.key === "generic-record");
    return filtered.length ? filtered : templates;
  }, [moduleKey, templates]);

  const payload = (): any => ({
    template: selectedTemplate,
    module: moduleKey,
    recordId: row?.id,
    data: row?.id ? undefined : { module: moduleTitle, rowsCount: "Impression de liste", generatedAt: new Date().toISOString() },
    locale,
    watermark: watermark.trim() || undefined,
    includeQr: true,
    includeBarcode: true,
  });

  const run = async (action: "preview" | "download" | "print" | "email") => {
    setPosting(action);
    setError("");
    try {
      if (action === "preview") await printService.openPdf(payload(), "inline");
      if (action === "download") await printService.openPdf(payload(), "attachment");
      if (action === "print") await printService.print(payload());
      if (action === "email") {
        if (!emailTo.trim()) throw new Error("Saisissez l’adresse email du destinataire.");
        await printService.email({ ...payload(), to: emailTo.trim(), message });
      }
    } catch (err: any) {
      setError(readError(err));
    } finally {
      setPosting("");
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/40">
      <div className="ml-auto h-full w-full max-w-3xl overflow-y-auto border-l border-slate-300 bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-7 py-5">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Documents & impression</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{moduleTitle}{row?.id ? ` · ${row.id}` : " · impression du module"}</p>
          </div>
          <button onClick={onClose} className="border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"><X className="size-5" /></button>
        </div>

        <div className="space-y-6 p-7">
          {error && <ProfessionalError message={error} />}
          {loading ? <div className="border border-slate-200 p-8 text-center text-sm font-semibold text-slate-500"><Loader2 className="mx-auto mb-3 size-5 animate-spin text-blue-700" />Chargement des modèles...</div> : <>
            <section className="border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">Modèle professionnel</p>
              <select value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)} className="mt-3 w-full border border-slate-300 bg-white px-3 py-3 text-sm font-black text-slate-900 outline-none focus:border-blue-700">
                {relevantTemplates.map((template) => <option key={template.key} value={template.key}>{template.title} · {template.category}</option>)}
              </select>
              <p className="mt-2 text-xs font-semibold text-slate-500">{relevantTemplates.find((template) => template.key === selectedTemplate)?.description}</p>
            </section>

            <div className="grid gap-5 md:grid-cols-2">
              <TextField label="Watermark" value={watermark} onChange={setWatermark} />
              <TextField label="Destinataire email" value={emailTo} onChange={setEmailTo} />
            </div>
            <TextAreaField label="Message email" value={message} onChange={setMessage} />

            <section className="border border-slate-200 bg-white p-5">
              <h3 className="font-black text-slate-950">Contenu inclus automatiquement</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {["Logo & identité hôpital", "Patient / dossier", "QR code & code-barres", "Signature numérique", "Notice confidentialité", "Pagination"].map((item) => <div key={item} className="border border-slate-100 bg-slate-50 p-3 text-xs font-black text-slate-700">{item}</div>)}
              </div>
            </section>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
              <button onClick={() => run("preview")} disabled={Boolean(posting)} className="inline-flex h-12 items-center gap-2 border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-50">{posting === "preview" ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}Aperçu</button>
              <button onClick={() => run("download")} disabled={Boolean(posting)} className="inline-flex h-12 items-center gap-2 border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-50">{posting === "download" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}Télécharger</button>
              <button onClick={() => run("print")} disabled={Boolean(posting)} className="inline-flex h-12 items-center gap-2 bg-blue-700 px-5 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50">{posting === "print" ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}Imprimer</button>
              <button onClick={() => run("email")} disabled={Boolean(posting)} className="inline-flex h-12 items-center gap-2 bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50">{posting === "email" ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}Email</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}
