"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeDollarSign, Camera, Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import type { HospitalField } from "@/shared/types/hospital.types";
import { api } from "@/shared/lib/http/api";
import Autocomplete, { type AutocompleteOption } from "@/components/ui/autocomplete";
import RichTextEditor from "@/components/forms/RichTextEditor";
import { formatValue, normalizeRows, relationLabel } from "./utils";
import { ModulePermissionsEditor } from "./ModulePermissionsEditor";

export function FieldInput({ field, value, onChange, locale = "fr", form }: { field: HospitalField; value: any; onChange: (value: any) => void; locale?: string; form?: Record<string, any> }) {
  const base = "w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white";
  const autoBase = "w-full border border-dashed border-slate-200 bg-slate-100 px-3 py-3 text-sm font-black text-slate-500 outline-none";
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastAutoPaymentRef = useRef("");

  useEffect(() => {
    if (!field.reference) return;
    let mounted = true;
    setLoading(true);
    api.get(field.reference.endpoint)
      .then((response) => {
        if (!mounted) return;
        setOptions(normalizeRows(response.data).map((row) => ({
          id: String(row[field.reference?.valueKey ?? "id"] ?? row.id ?? ""),
          label: relationLabel(row, field.reference?.labelKeys ?? []),
          description: relationLabel(row, field.reference?.descriptionKeys ?? []),
        })).filter((option) => option.id));
      })
      .catch(() => mounted && setOptions([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [field.reference?.endpoint]);

  const datalistId = `list-${field.name}`;
  const selectedValues = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];

  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (!form?.patientId || field.name !== "insuranceRate") return;
    if (Number(value || 0) > 0) return;
    let mounted = true;
    api.get("/insurance/coverages", { params: { patientId: form.patientId, limit: 1 } })
      .then((response) => {
        if (!mounted) return;
        const coverage = normalizeRows(response.data).find((item) => String(item.status ?? "").toUpperCase() === "ACTIVE") ?? normalizeRows(response.data)[0];
        const rate = Number(coverage?.coverageRate ?? coverage?.coverage_rate ?? 0);
        if (Number.isFinite(rate) && rate > 0) onChange(rate);
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, [field.name, form?.patientId]);

  useEffect(() => {
    if (field.name !== "paidAmount") return;
    const total = pharmacySaleTotal(form?.lines);
    if (total <= 0) return;
    const insuranceRate = Math.max(0, Math.min(100, Number(form?.insuranceRate ?? 0)));
    const mutualRate = Math.max(0, Math.min(100, Number(form?.mutualRate ?? 0)));
    const due = Math.max(0, Math.round((total - total * insuranceRate / 100 - total * mutualRate / 100) * 100) / 100);
    const current = String(value ?? "");
    const next = String(due);
    if (!current || Number(current) === 0 || current === lastAutoPaymentRef.current) {
      lastAutoPaymentRef.current = next;
      onChange(due);
    }
  }, [field.name, form?.lines, form?.insuranceRate, form?.mutualRate]);

  const uploadFile = async (file: File) => {
    setUploadingFile(true);
    try {
      const response = await api.post("/files/upload-url", { fileName: file.name, contentType: file.type || "application/octet-stream", size: file.size, patientId: form?.patientId || undefined });
      const upload = response.data;
      const body = new FormData();
      Object.entries(upload.fields ?? {}).forEach(([key, item]) => body.append(key, String(item)));
      body.append("file", file);
      const cloudinaryResponse = await fetch(upload.url, { method: upload.method || "POST", body });
      const result = await cloudinaryResponse.json();
      if (!cloudinaryResponse.ok) throw new Error(result?.error?.message || "Upload Cloudinary impossible");
      const payload = {
        provider: "cloudinary",
        fileId: upload.file?.id,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
      };
      onChange(field.name === "url" || field.name.toLowerCase().includes("url") ? result.secure_url : payload);
    } finally {
      setUploadingFile(false);
    }
  };

  const startCamera = async () => {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Caméra non disponible dans ce navigateur.");
      return;
    }
    setCameraStarting(true);
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 960 } }, audio: false });
      setCameraStream(stream);
    } catch {
      setCameraError("Autorisez l'accès caméra pour capturer la photo.");
    } finally {
      setCameraStarting(false);
    }
  };

  const stopCamera = () => {
    setCameraStream((stream) => {
      stream?.getTracks().forEach((track) => track.stop());
      return null;
    });
  };

  const captureCameraPhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) return;
    stopCamera();
    await uploadFile(new File([blob], `${field.name}-${Date.now()}.jpg`, { type: "image/jpeg" }));
  };

  return (
    <label className={field.type === "multiselect" || field.type === "module-permissions" || field.type === "price-list-items" || field.type === "purchase-order-items" || field.type === "dispensation-items" || field.type === "prescription-items" || field.type === "pharmacy-sale-items" ? "block md:col-span-2" : "block"}>
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{field.label}{field.required ? " *" : ""}</span>
      {field.type === "module-permissions" ? (
        <ModulePermissionsEditor value={value} roles={form?.roles} onChange={onChange} locale={locale} />
      ) : field.autoGenerated ? (
        <input value={value ? formatValue(value) : locale === "en" ? "Generated automatically" : "Généré automatiquement"} readOnly className={autoBase} />
      ) : field.type === "price-list-items" ? (
        <PriceListItemsField value={value} onChange={onChange} locale={locale} form={form} />
      ) : field.type === "purchase-order-items" ? (
        <PurchaseOrderItemsField value={value} onChange={onChange} locale={locale} />
      ) : field.type === "dispensation-items" ? (
        <DispensationItemsField value={value} onChange={onChange} locale={locale} />
      ) : field.type === "prescription-items" ? (
        <PrescriptionItemsField value={value} onChange={onChange} locale={locale} />
      ) : field.type === "pharmacy-sale-items" ? (
        <PharmacySaleItemsField value={value} onChange={onChange} locale={locale} />
      ) : field.reference ? (
        <Autocomplete value={String(value ?? "")} options={options} isLoading={loading} placeholder={field.placeholder || `${locale === "en" ? "Select" : "Sélectionner"} ${field.label.toLowerCase()}`} searchPlaceholder={`${locale === "en" ? "Search" : "Rechercher"} ${field.label.toLowerCase()}`} emptyText={locale === "en" ? "No result" : "Aucun résultat"} onSelect={(option) => onChange(option.id)} showIdFallback={false} />
      ) : field.type === "multiselect" ? (
        <div className="grid gap-2 border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
          {(field.options ?? []).map((option) => {
            const checked = selectedValues.includes(option.value);
            return (
              <label key={option.value} className={`flex items-center gap-2 border bg-white px-3 py-2 text-xs font-black ${checked ? "border-blue-700 text-blue-800" : "border-slate-200 text-slate-700"}`}>
                <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked ? [...selectedValues, option.value] : selectedValues.filter((item) => item !== option.value))} />
                {option.label}
              </label>
            );
          })}
        </div>
      ) : field.type === "select" && field.allowCustom ? (
        <>
          <input list={datalistId} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} placeholder={locale === "en" ? "Select or create..." : "Sélectionner ou créer..."} className={base} />
          <datalist id={datalistId}>{(field.options ?? []).map((option) => <option key={option.value} value={option.value} />)}</datalist>
        </>
      ) : field.type === "select" ? (
        <select value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} className={base}>
          <option value="">-</option>
          {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : field.type === "json" ? (
        <RichTextEditor value={jsonValueToEditor(value)} onChange={onChange} minHeight="min-h-32" />
      ) : field.type === "file" || field.type === "image" ? (
        <div className="space-y-3">
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center hover:border-blue-700 hover:bg-white">
            {imagePreview(value) ? (
              <img src={imagePreview(value)} alt={field.label} className="h-28 w-28 border border-slate-200 object-cover" />
            ) : uploadingFile ? (
              <Loader2 className="size-6 animate-spin text-blue-700" />
            ) : field.type === "image" ? (
              <Camera className="size-7 text-slate-500" />
            ) : (
              <UploadCloud className="size-6 text-slate-500" />
            )}
            <span className="text-sm font-black text-slate-800">{uploadingFile ? "Téléversement..." : field.type === "image" ? "Capturer ou importer la photo" : "Téléverser vers Cloudinary"}</span>
            <span className="text-xs font-semibold text-slate-500">{field.placeholder || (field.type === "image" ? "Caméra, PNG ou JPG" : "PDF, image, DICOM ou document")}</span>
            <input type="file" accept={field.type === "image" ? "image/*" : "application/pdf,image/*,text/plain,application/dicom,.dcm"} capture={field.type === "image" ? "user" : undefined} className="hidden" disabled={uploadingFile} onChange={(event) => event.target.files?.[0] && uploadFile(event.target.files[0])} />
          </label>
          {field.type === "image" ? (
            <div className="space-y-3">
              {!cameraStream ? (
                <button type="button" onClick={startCamera} disabled={cameraStarting || uploadingFile} className="inline-flex w-full items-center justify-center gap-2 border border-blue-700 bg-white px-4 py-3 text-sm font-black text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60">
                  {cameraStarting ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                  Prendre une photo avec la caméra
                </button>
              ) : (
                <div className="grid gap-3 border border-slate-200 bg-slate-950 p-3">
                  <video ref={videoRef} autoPlay playsInline muted className="max-h-72 w-full bg-black object-cover" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button type="button" onClick={captureCameraPhoto} disabled={uploadingFile} className="inline-flex items-center justify-center gap-2 bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800">
                      {uploadingFile ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                      Capturer
                    </button>
                    <button type="button" onClick={stopCamera} className="border border-white/30 px-4 py-3 text-sm font-black text-white hover:bg-white/10">
                      Annuler
                    </button>
                  </div>
                </div>
              )}
              {cameraError ? <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">{cameraError}</p> : null}
            </div>
          ) : null}
          {value ? <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">{field.type === "image" ? "Photo employé attachée" : typeof value === "string" ? value : value.fileName || value.url || "Fichier Cloudinary attaché"}</div> : null}
        </div>
      ) : field.type === "color" ? (
        <div className="flex items-center gap-3">
          <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(String(value ?? "")) ? String(value) : "#1d4ed8"} onChange={(event) => onChange(event.target.value)} className="h-12 w-16 cursor-pointer border border-slate-200 bg-white p-1" />
          <input type="text" value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder || "#1d4ed8"} className={base} />
        </div>
      ) : field.type === "textarea" ? (
        <textarea value={typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2)} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} className={`${base} h-28 text-sm`} />
      ) : field.type === "checkbox" ? (
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
      ) : (
        <input type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : field.name === "password" || field.name.toLowerCase().includes("pin") ? "password" : "text"} value={value ?? ""} onChange={(event) => {
          if (field.name === "paidAmount") lastAutoPaymentRef.current = "";
          onChange(field.type === "number" ? Number(event.target.value) : event.target.value);
        }} placeholder={field.name === "password" ? (locale === "en" ? "Minimum 10 characters" : "Minimum 10 caractères") : field.name.toLowerCase().includes("pin") ? "4 à 8 chiffres" : field.placeholder} className={base} />
      )}
    </label>
  );
}

function pharmacySaleTotal(lines: any) {
  const rows = Array.isArray(lines) ? lines : [];
  return rows.reduce((sum, row) => sum + Number(row.quantity || 0) * Number(row.unitPrice || 0), 0);
}

function imagePreview(value: any) {
  if (!value) return "";
  if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
  if (typeof value === "object") return value.secureUrl || value.secure_url || value.url || "";
  return "";
}

function PrescriptionItemsField({ value, onChange, locale }: { value: any; onChange: (value: any) => void; locale: string }) {
  const rows = Array.isArray(value) ? value : [];
  const [medicines, setMedicines] = useState<Array<{ id: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get("/pharmacy/medicines")
      .then((response) => mounted && setMedicines(normalizeRows(response.data).map((medicine) => ({
        id: String(medicine.id ?? ""),
        label: [medicine.name, medicine.strength, medicine.form].filter(Boolean).join(" · "),
      })).filter((medicine) => medicine.id)))
      .catch(() => mounted && setMedicines([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const updateRow = (index: number, patch: Record<string, any>) => onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  const addRow = () => onChange([...rows, { medicine: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  const removeRow = (index: number) => onChange(rows.filter((_, rowIndex) => rowIndex !== index));

  return (
    <div>
      <div className="overflow-x-auto border border-slate-200 bg-white">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[minmax(230px,1.4fr)_130px_140px_120px_minmax(220px,1.2fr)_44px] gap-2 bg-slate-50 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
            <span>Médicament</span><span>Dose</span><span>Fréquence</span><span>Durée</span><span>Consignes</span><span />
          </div>
          <div className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <div key={index} className="grid grid-cols-[minmax(230px,1.4fr)_130px_140px_120px_minmax(220px,1.2fr)_44px] gap-2 p-3">
                <>
                  <input list={`prescription-medicines-${index}`} value={row.medicine ?? ""} onChange={(event) => updateRow(index, { medicine: event.target.value, medicineId: "" })} placeholder={loading ? "Chargement des suggestions..." : "Nom du médicament"} className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white" />
                  <datalist id={`prescription-medicines-${index}`}>{medicines.map((medicine) => <option key={medicine.id} value={medicine.label} />)}</datalist>
                </>
                <input value={row.dosage ?? ""} onChange={(event) => updateRow(index, { dosage: event.target.value })} placeholder="ex. 500 mg" className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white" />
                <input value={row.frequency ?? ""} onChange={(event) => updateRow(index, { frequency: event.target.value })} placeholder="ex. 3x/jour" className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white" />
                <input value={row.duration ?? ""} onChange={(event) => updateRow(index, { duration: event.target.value })} placeholder="ex. 5 jours" className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white" />
                <textarea value={row.instructions ?? ""} onChange={(event) => updateRow(index, { instructions: event.target.value })} placeholder="Après repas, surveillance, renouvellement..." className="h-20 resize-none border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white" />
                <button type="button" onClick={() => removeRow(index)} className="h-10 border border-slate-200 text-sm font-black text-slate-500 hover:bg-rose-50 hover:text-rose-700">×</button>
              </div>
            ))}
            {!rows.length ? <p className="p-4 text-sm font-semibold text-slate-500">{locale === "en" ? "Add prescribed medicines." : "Ajoutez les médicaments prescrits avec posologie et durée."}</p> : null}
          </div>
        </div>
      </div>
      <button type="button" onClick={addRow} className="mt-3 border border-blue-700 bg-white px-4 py-2 text-sm font-black text-blue-800 hover:bg-blue-50">Ajouter une ligne d’ordonnance</button>
    </div>
  );
}

function DispensationItemsField({ value, onChange, locale }: { value: any; onChange: (value: any) => void; locale: string }) {
  const rows = Array.isArray(value) ? value : [];
  const [medicines, setMedicines] = useState<Array<{ id: string; label: string }>>([]);
  const [batches, setBatches] = useState<Array<{ id: string; medicineId: string; label: string; quantity: number }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([api.get("/pharmacy/medicines"), api.get("/pharmacy/batches")])
      .then(([medicineResponse, batchResponse]) => {
        if (!mounted) return;
        setMedicines(normalizeRows(medicineResponse.data).map((medicine) => ({
          id: String(medicine.id ?? ""),
          label: [medicine.name, medicine.code, medicine.strength].filter(Boolean).join(" · "),
        })).filter((medicine) => medicine.id));
        setBatches(normalizeRows(batchResponse.data).map((batch) => ({
          id: String(batch.id ?? ""),
          medicineId: String(batch.medicineId ?? ""),
          quantity: Number(batch.quantity ?? 0),
          label: [batch.batchNumber, batch.expiryDate, `${Number(batch.quantity ?? 0).toLocaleString(locale === "en" ? "en-US" : "fr-FR")} en stock`].filter(Boolean).join(" · "),
        })).filter((batch) => batch.id && batch.medicineId));
      })
      .catch(() => { if (mounted) { setMedicines([]); setBatches([]); } })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [locale]);

  const updateRow = (index: number, patch: Record<string, any>) => onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  const addRow = () => onChange([...rows, { medicineId: "", batchId: "", quantity: 1 }]);
  const removeRow = (index: number) => onChange(rows.filter((_, rowIndex) => rowIndex !== index));

  return (
    <div>
      <div className="overflow-hidden border border-slate-200 bg-white">
        <div className="grid grid-cols-[minmax(220px,1.3fr)_minmax(180px,1fr)_110px_44px] gap-2 bg-slate-50 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
          <span>Médicament</span><span>Lot</span><span>Quantité</span><span />
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map((row, index) => {
            const availableBatches = batches.filter((batch) => batch.medicineId === row.medicineId);
            return (
              <div key={index} className="grid grid-cols-[minmax(220px,1.3fr)_minmax(180px,1fr)_110px_44px] gap-2 p-3">
                <select value={row.medicineId ?? ""} onChange={(event) => updateRow(index, { medicineId: event.target.value, batchId: "" })} className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white">
                  <option value="">{loading ? "Chargement..." : "Choisir le médicament"}</option>
                  {medicines.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.label}</option>)}
                </select>
                <select value={row.batchId ?? ""} onChange={(event) => updateRow(index, { batchId: event.target.value })} className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white">
                  <option value="">Choisir le lot</option>
                  {availableBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.label}</option>)}
                </select>
                <input type="number" min="1" step="1" value={row.quantity ?? ""} onChange={(event) => updateRow(index, { quantity: event.target.value })} className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white" />
                <button type="button" onClick={() => removeRow(index)} className="border border-slate-200 text-sm font-black text-slate-500 hover:bg-rose-50 hover:text-rose-700">×</button>
              </div>
            );
          })}
          {!rows.length ? <p className="p-4 text-sm font-semibold text-slate-500">{locale === "en" ? "Add dispensed medicines." : "Ajoutez les médicaments délivrés."}</p> : null}
        </div>
      </div>
      <button type="button" onClick={addRow} className="mt-3 border border-blue-700 bg-white px-4 py-2 text-sm font-black text-blue-800 hover:bg-blue-50">Ajouter un médicament</button>
    </div>
  );
}

function PharmacySaleItemsField({ value, onChange, locale }: { value: any; onChange: (value: any) => void; locale: string }) {
  const rows = Array.isArray(value) ? value : [];
  const [medicines, setMedicines] = useState<Array<{ id: string; label: string; stock: number; unitPrice: number; code: string }>>([]);
  const [loading, setLoading] = useState(false);
  const currency = "USD";

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([api.get("/pharmacy/medicines"), api.get("/pharmacy/batches")])
      .then(([medicineResponse, batchResponse]) => {
        if (!mounted) return;
        const stockByMedicine = normalizeRows(batchResponse.data).reduce<Record<string, number>>((acc, batch) => {
          const medicineId = String(batch.medicineId ?? "");
          if (!medicineId) return acc;
          acc[medicineId] = (acc[medicineId] ?? 0) + Number(batch.availableQuantity ?? batch.available_quantity ?? batch.quantity ?? 0);
          return acc;
        }, {});
        setMedicines(normalizeRows(medicineResponse.data).map((medicine) => {
          const unitPrice = Number(medicine.publicPrice ?? medicine.public_price ?? medicine.price ?? medicine.unitPrice ?? 0);
          const id = String(medicine.id ?? "");
          const stock = stockByMedicine[id] ?? Number(medicine.currentStock ?? medicine.availableQuantity ?? medicine.quantity ?? medicine.stock ?? 0);
          const code = String(medicine.code ?? medicine.cipCode ?? medicine.ucdCode ?? "");
          return {
            id,
            code,
            stock,
            unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
            label: [medicine.name, medicine.strength, medicine.form, code].filter(Boolean).join(" · "),
          };
        }).filter((medicine) => medicine.id));
      })
      .catch(() => mounted && setMedicines([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const money = (amount: number) => amount.toLocaleString(locale === "en" ? "en-US" : "fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const updateRow = (index: number, patch: Record<string, any>) => onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  const addRow = () => onChange([...rows, { medicineId: "", quantity: 1, unitPrice: "" }]);
  const removeRow = (index: number) => onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  const selectedMedicine = (medicineId: string) => medicines.find((medicine) => medicine.id === medicineId);
  const total = rows.reduce((sum, row) => sum + Number(row.quantity || 0) * Number(row.unitPrice || 0), 0);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="grid grid-cols-[minmax(340px,1.6fr)_140px_180px_170px_56px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
          <span>Médicament</span><span>Qté vendue</span><span>Prix unitaire</span><span>Total ligne</span><span />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row, index) => {
            const medicine = selectedMedicine(row.medicineId ?? "");
            const lineTotal = Number(row.quantity || 0) * Number(row.unitPrice || 0);
            const hasCataloguePrice = Boolean(medicine && medicine.unitPrice > 0);
            return (
              <div key={index} className="grid grid-cols-[minmax(340px,1.6fr)_140px_180px_170px_56px] gap-3 p-4">
                <div>
                  <select
                    value={row.medicineId ?? ""}
                    onChange={(event) => {
                      const medicineItem = selectedMedicine(event.target.value);
                      updateRow(index, { medicineId: event.target.value, unitPrice: medicineItem?.unitPrice || "" });
                    }}
                    className="h-12 w-full border border-slate-200 bg-slate-50 px-3 text-sm font-black outline-none focus:border-blue-700 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500"
                  >
                    <option value="">{loading ? "Chargement..." : "Choisir le médicament vendu"}</option>
                    {medicines.map((medicineItem) => <option key={medicineItem.id} value={medicineItem.id}>{medicineItem.label}</option>)}
                  </select>
                  {medicine ? (
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wide">
                      {medicine.code ? <span className="bg-slate-950 px-2 py-1 text-white dark:bg-slate-800">{medicine.code}</span> : null}
                      <span className="bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-200">Stock: {Number.isFinite(medicine.stock) ? medicine.stock.toLocaleString(locale === "en" ? "en-US" : "fr-FR") : "-"}</span>
                      {hasCataloguePrice ? <span className="bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Prix catalogue</span> : <span className="bg-amber-100 px-2 py-1 text-amber-800 dark:bg-amber-950 dark:text-amber-200">Saisir le prix public</span>}
                    </div>
                  ) : null}
                </div>
                <input type="number" min="1" step="1" value={row.quantity ?? ""} onChange={(event) => updateRow(index, { quantity: event.target.value })} className="h-12 border border-slate-200 bg-slate-50 px-3 text-sm font-black outline-none focus:border-blue-700 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.unitPrice ?? ""}
                  onChange={(event) => updateRow(index, { unitPrice: event.target.value })}
                  readOnly={hasCataloguePrice}
                  placeholder={hasCataloguePrice ? "Prix catalogue" : "Prix public"}
                  className={`h-12 border px-3 text-sm font-black outline-none ${hasCataloguePrice ? "border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" : "border-amber-300 bg-amber-50 text-amber-950 focus:border-blue-700 focus:bg-white dark:border-amber-700 dark:bg-slate-950 dark:text-amber-100 dark:focus:border-blue-500"}`}
                />
                <div className="flex h-12 items-center border border-slate-100 bg-slate-50 px-3 text-sm font-black text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">{money(Number.isFinite(lineTotal) ? lineTotal : 0)} {currency}</div>
                <button type="button" onClick={() => removeRow(index)} className="flex size-12 items-center justify-center border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-rose-950" title="Retirer">
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
          {!rows.length ? (
            <div className="p-5">
              <p className="text-sm font-black text-slate-800">Aucun médicament ajouté.</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Ajoutez chaque médicament avec la quantité vendue et le prix unitaire.</p>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-950">
          <button type="button" onClick={addRow} className="inline-flex h-11 w-fit items-center gap-2 border border-blue-700 bg-white px-4 text-sm font-black text-blue-800 hover:bg-blue-50 dark:bg-slate-950 dark:text-blue-300 dark:hover:bg-slate-900">
            <Plus className="size-4" />
            Ajouter un médicament
          </button>
          <div className="text-sm font-black text-slate-900 dark:text-slate-100">Total vente: {money(total)} {currency}</div>
        </div>
      </div>
    </div>
  );
}

function PurchaseOrderItemsField({ value, onChange, locale }: { value: any; onChange: (value: any) => void; locale: string }) {
  const rows = Array.isArray(value) ? value : [];
  const updateRow = (index: number, patch: Record<string, any>) => onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  const addRow = () => onChange([...rows, { description: "", quantity: 1, unitPrice: "" }]);
  const removeRow = (index: number) => onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  const total = rows.reduce((sum, row) => sum + Number(row.quantity ?? 0) * Number(row.unitPrice ?? 0), 0);

  return (
    <div>
      <div className="overflow-hidden border border-slate-200 bg-white">
        <div className="grid grid-cols-[minmax(220px,1.5fr)_110px_130px_120px_44px] gap-2 bg-slate-50 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
          <span>Article</span><span>Quantité</span><span>Prix unitaire</span><span>Total</span><span />
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map((row, index) => {
            const lineTotal = Number(row.quantity ?? 0) * Number(row.unitPrice ?? 0);
            return (
              <div key={index} className="grid grid-cols-[minmax(220px,1.5fr)_110px_130px_120px_44px] gap-2 p-3">
                <input value={row.description ?? ""} onChange={(event) => updateRow(index, { description: event.target.value })} placeholder="Nom de l’article" className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white" />
                <input type="number" min="1" step="1" value={row.quantity ?? ""} onChange={(event) => updateRow(index, { quantity: event.target.value })} className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white" />
                <input type="number" min="0" step="0.01" value={row.unitPrice ?? ""} onChange={(event) => updateRow(index, { unitPrice: event.target.value })} placeholder="0" className="border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white" />
                <div className="flex items-center border border-slate-100 bg-slate-50 px-3 text-sm font-black text-slate-700">{Number.isFinite(lineTotal) ? lineTotal.toLocaleString(locale === "en" ? "en-US" : "fr-FR", { maximumFractionDigits: 2 }) : "0"}</div>
                <button type="button" onClick={() => removeRow(index)} className="border border-slate-200 text-sm font-black text-slate-500 hover:bg-rose-50 hover:text-rose-700">×</button>
              </div>
            );
          })}
          {!rows.length ? <p className="p-4 text-sm font-semibold text-slate-500">{locale === "en" ? "Add order items." : "Ajoutez les articles de la commande."}</p> : null}
        </div>
        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800">Total: {total.toLocaleString(locale === "en" ? "en-US" : "fr-FR", { maximumFractionDigits: 2 })}</div>
      </div>
      <button type="button" onClick={addRow} className="mt-3 border border-blue-700 bg-white px-4 py-2 text-sm font-black text-blue-800 hover:bg-blue-50">Ajouter un article</button>
    </div>
  );
}

function PriceListItemsField({ value, onChange, locale, form }: { value: any; onChange: (value: any) => void; locale: string; form?: Record<string, any> }) {
  const rows = Array.isArray(value) ? value : [];
  const [services, setServices] = useState<Array<{ id: string; code: string; name: string; label: string; description: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get("/pricing/services")
      .then((response) => mounted && setServices(normalizeRows(response.data).map((service) => {
        const code = String(service.code ?? "");
        const name = String(service.name ?? "");
        return {
          id: String(service.id ?? ""),
          code,
          name,
          label: [name, code].filter(Boolean).join(" · "),
          description: [service.category, service.unit, service.sourceModule, service.sourceEvent].filter(Boolean).join(" · "),
        };
      }).filter((service) => service.id)))
      .catch(() => mounted && setServices([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (rows.length || !services.length) return;
    const name = String(form?.name ?? "").toUpperCase();
    const preferredCode = name.includes("BED") || name.includes("NUIT") ? "BED_NIGHT" : "";
    if (!preferredCode) return;
    const service = services.find((item) => item.code === preferredCode);
    if (service) onChange([{ serviceId: service.id, unitPrice: "", insurancePrice: "" }]);
  }, [form?.name, rows.length, services, onChange]);

  const updateRow = (index: number, patch: Record<string, any>) => onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  const addRow = (serviceId = "") => onChange([...rows, { serviceId, unitPrice: "", insurancePrice: "" }]);
  const removeRow = (index: number) => onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  const commonCodes = ["BED_NIGHT", "CONSULTATION", "CON-001", "TRI-002", "EMERGENCY_VISIT"];
  const quickServices = commonCodes.map((code) => services.find((service) => service.code === code)).filter((service): service is NonNullable<typeof service> => Boolean(service));
  const totalPatient = rows.reduce((sum, row) => sum + Number(row.unitPrice || 0), 0);
  const selectedService = (serviceId: string) => services.find((service) => service.id === serviceId);

  return (
    <div className="space-y-3">
      <div className="border border-slate-200 bg-slate-50">
        <div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="flex gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center bg-blue-700 text-white">
              <BadgeDollarSign className="size-5" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-950">{locale === "en" ? "Price list used by invoicing" : "Grille utilisée par la facturation"}</p>
              <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                {locale === "en"
                  ? "Add each billable service and its patient price. For an admission invoice, BED_NIGHT is the price of one hospital night."
                  : "Ajoutez chaque prestation facturable avec son prix patient. Pour une admission, BED_NIGHT correspond au prix d’une nuit d’hospitalisation."}
              </p>
            </div>
          </div>
          <div className="border border-slate-200 bg-white p-3">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{locale === "en" ? "Fast services" : "Prestations rapides"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickServices.map((service) => (
                <button key={service.id} type="button" onClick={() => addRow(service.id)} className="inline-flex h-9 items-center gap-2 border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-800 hover:border-blue-700 hover:bg-white">
                  <Plus className="size-3.5" />
                  {service.code}
                </button>
              ))}
              {!quickServices.length && <span className="text-xs font-semibold text-slate-500">{loading ? "Chargement..." : "Aucune prestation rapide disponible"}</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-hidden border border-slate-200 bg-white">
        <div className="grid grid-cols-[minmax(300px,1.7fr)_160px_170px_44px] gap-3 border-b border-slate-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">
          <span>Prestation à facturer</span><span>Prix patient</span><span>Prix assurance</span><span />
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map((row, index) => {
            const service = selectedService(row.serviceId ?? "");
            return (
              <div key={index} className="grid grid-cols-[minmax(300px,1.7fr)_160px_170px_44px] gap-3 p-4">
                <div>
                  <select value={row.serviceId ?? ""} onChange={(event) => updateRow(index, { serviceId: event.target.value })} className="w-full border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold outline-none focus:border-blue-700 focus:bg-white">
                    <option value="">{loading ? "Chargement..." : "Choisir la prestation"}</option>
                    {services.map((item) => <option key={item.id} value={item.id}>{item.label}{item.description ? ` (${item.description})` : ""}</option>)}
                  </select>
                  {service && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wide">
                      <span className="bg-slate-950 px-2 py-1 text-white">{service.code}</span>
                      {service.description && <span className="bg-slate-100 px-2 py-1 text-slate-600">{service.description}</span>}
                    </div>
                  )}
                </div>
                <input type="number" min="0" step="0.01" value={row.unitPrice ?? ""} onChange={(event) => updateRow(index, { unitPrice: event.target.value })} placeholder="ex. 25" className="h-12 border border-slate-200 bg-slate-50 px-3 text-sm font-black outline-none focus:border-blue-700 focus:bg-white" />
                <input type="number" min="0" step="0.01" value={row.insurancePrice ?? ""} onChange={(event) => updateRow(index, { insurancePrice: event.target.value })} placeholder="Optionnel" className="h-12 border border-slate-200 bg-slate-50 px-3 text-sm font-black outline-none focus:border-blue-700 focus:bg-white" />
                <button type="button" onClick={() => removeRow(index)} className="flex size-12 items-center justify-center border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-700" title="Retirer la prestation">
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
          {!rows.length ? (
            <div className="p-5">
              <p className="text-sm font-black text-slate-800">{locale === "en" ? "No billable service yet." : "Aucune prestation facturable ajoutée."}</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">{locale === "en" ? "Use the fast buttons above or add a service manually." : "Utilisez les raccourcis au-dessus ou ajoutez une prestation manuellement."}</p>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => addRow()} className="inline-flex h-11 w-fit items-center gap-2 border border-blue-700 bg-white px-4 text-sm font-black text-blue-800 hover:bg-blue-50">
            <Plus className="size-4" />
            Ajouter une prestation
          </button>
          <div className="text-sm font-black text-slate-900">
            Total prix patient: {totalPatient.toLocaleString(locale === "en" ? "en-US" : "fr-FR", { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
}

function jsonValueToEditor(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.content === "string") return value.content;
  return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char] ?? char));
}
