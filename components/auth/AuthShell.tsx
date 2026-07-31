"use client";

import {
    HelpCircle,
    ScrollText,
    ShieldCheck,
} from "lucide-react";
import { useTenantConfig } from "@/providers/TenantConfigProvider";

export default function AuthShell({ children }: { children: React.ReactNode }) {
    const tenantConfig = useTenantConfig();
    const tenantName = tenantConfig.tenant.name || "Doclyn";
    const logoUrl = tenantConfig.branding.logoUrl;

    return (
        <main className="min-h-screen bg-slate-100">
            <section
                className="relative mx-auto flex min-h-screen flex-col overflow-hidden rounded border border-slate-200 bg-[#f8f9fc]"
                style={{
                    backgroundImage: "radial-gradient(#cfd5e2 1px, transparent 1px)",
                    backgroundSize: "18px 18px",
                }}
            >
                <div className="absolute left-8 top-8 z-10 flex items-center gap-3">
                    {logoUrl ? (
                        <img src={logoUrl} alt={tenantName} className="h-16 w-auto max-w-[220px] object-contain" />
                    ) : (
                        <div className="grid h-12 w-12 place-items-center bg-[var(--primary)] text-white">
                            <ShieldCheck className="size-6" />
                        </div>
                    )}
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Portail hospitalier</p>
                        <strong className="block text-lg font-black text-slate-950">{tenantName}</strong>
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-center px-4 py-10">
                    {children}
                </div>

                <footer className="flex flex-col gap-3 px-6 pb-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
                    <p>© 2026 {tenantName}. Tous droits réservés.</p>

                    <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" /> Privacy
            </span>
                        <span className="inline-flex items-center gap-1.5">
              <ScrollText className="size-3.5" /> Terms
            </span>
                        <span className="inline-flex items-center gap-1.5">
              <HelpCircle className="size-3.5" /> Get help
            </span>
                    </div>
                </footer>
            </section>
        </main>
    );
}
