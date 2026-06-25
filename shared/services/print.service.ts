import { api } from "@/shared/lib/http/api";

export type PrintTemplate = {
  key: string;
  title: string;
  category: string;
  defaultModule?: string;
  description: string;
};

export type GeneratePrintPayload = {
  template: string;
  module?: string;
  recordId?: string;
  data?: Record<string, unknown>;
  locale?: "fr" | "en";
  watermark?: string;
  includeQr?: boolean;
  includeBarcode?: boolean;
};

export const printService = {
  async templates(): Promise<{ templates: PrintTemplate[]; grouped: Record<string, PrintTemplate[]> }> {
    const response = await api.get("/print/templates");
    return response.data;
  },

  async openPdf(payload: GeneratePrintPayload, disposition: "inline" | "attachment" = "inline") {
    const response = await api.post(`/print/generate?disposition=${disposition}`, payload, { responseType: "blob" });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    if (disposition === "attachment") {
      const link = document.createElement("a");
      link.href = url;
      link.download = `${payload.template}-${payload.recordId || Date.now()}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },

  async print(payload: GeneratePrintPayload) {
    const response = await api.post("/print/generate?disposition=inline", payload, { responseType: "blob" });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.src = url;
    document.body.appendChild(frame);
    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(frame);
        URL.revokeObjectURL(url);
      }, 2000);
    };
  },

  async email(payload: GeneratePrintPayload & { to: string; subject?: string; message?: string }) {
    const response = await api.post("/print/email", payload);
    return response.data;
  },
};
