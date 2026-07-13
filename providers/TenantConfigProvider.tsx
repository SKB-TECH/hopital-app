"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type TenantConfig = {
  tenant: { id: string | null; name: string; code: string; subdomain: string | null; status: string };
  branding: {
    logoUrl: string | null;
    colors: { primary: string; secondary: string; accent: string };
    cssVariables: Record<string, string>;
  };
  hostname: string;
  features: Record<string, unknown>;
};

const defaultConfig: TenantConfig = {
  tenant: { id: null, name: "Afia-Smart", code: "DEFAULT", subdomain: null, status: "DEFAULT" },
  branding: {
    logoUrl: null,
    colors: { primary: "#1d4ed8", secondary: "#0f172a", accent: "#0284c7" },
    cssVariables: {},
  },
  hostname: "localhost",
  features: {},
};

const TenantConfigContext = createContext<TenantConfig>(defaultConfig);

export function useTenantConfig() {
  return useContext(TenantConfigContext);
}

export function TenantConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<TenantConfig>(defaultConfig);

  useEffect(() => {
    let cancelled = false;
    async function loadTenantConfig() {
      const hostname = window.location.hostname;
      try {
        const response = await fetch(`/api/proxy/tenant/config?hostname=${encodeURIComponent(hostname)}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Tenant config ${response.status}`);
        const payload = (await response.json()) as TenantConfig;
        if (!cancelled) setConfig(payload);
      } catch {
        if (!cancelled) setConfig({ ...defaultConfig, hostname });
      }
    }
    loadTenantConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", config.branding.colors.primary);
    root.style.setProperty("--secondary", config.branding.colors.secondary);
    root.style.setProperty("--accent", config.branding.colors.accent);
    root.style.setProperty("--ring", config.branding.colors.accent);
    if (config.branding.logoUrl) root.style.setProperty("--tenant-logo-url", `url("${config.branding.logoUrl}")`);
    Object.entries(config.branding.cssVariables || {}).forEach(([key, value]) => {
      if (/^--[a-z0-9-]+$/i.test(key)) root.style.setProperty(key, String(value));
    });
    document.title = config.tenant.name || "Afia-Smart";
  }, [config]);

  const value = useMemo(() => config, [config]);
  return <TenantConfigContext.Provider value={value}>{children}</TenantConfigContext.Provider>;
}
