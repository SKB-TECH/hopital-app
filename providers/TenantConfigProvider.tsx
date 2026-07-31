"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "@/shared/services/auth.service";

type TenantConfig = {
  tenant: { id: string | null; name: string; code: string; status: string };
  branding: {
    logoUrl: string | null;
    colors: { primary: string; secondary: string; accent: string };
    cssVariables: Record<string, string>;
  };
  hostname: string;
  features: Record<string, unknown>;
};

declare global {
  interface Window {
    __DOCLYN_TENANT_CONFIG__?: TenantConfig;
  }
}

const defaultConfig: TenantConfig = {
  tenant: { id: null, name: "Doclyn", code: "DEFAULT", status: "DEFAULT" },
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
        const me = await authService.me().catch(() => null);
        const organizationId = typeof me?.organizationId === "string" ? me.organizationId : null;
        const query = organizationId
          ? `organizationId=${encodeURIComponent(organizationId)}`
          : `hostname=${encodeURIComponent(hostname)}`;
        const response = await fetch(`/api/proxy/tenant/config?${query}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`Tenant config ${response.status}`);
        const payload = (await response.json()) as TenantConfig;
        if (!cancelled) setConfig(payload);
      } catch {
        if (!cancelled) setConfig({ ...defaultConfig, hostname });
      }
    }
    loadTenantConfig();
    window.addEventListener("doclyn-auth-changed", loadTenantConfig);
    return () => {
      cancelled = true;
      window.removeEventListener("doclyn-auth-changed", loadTenantConfig);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", config.branding.colors.primary);
    root.style.setProperty("--secondary", config.branding.colors.secondary);
    root.style.setProperty("--accent", config.branding.colors.accent);
    root.style.setProperty("--ring", config.branding.colors.accent);
    if (config.branding.logoUrl) root.style.setProperty("--tenant-logo-url", `url("${config.branding.logoUrl}")`);
    else root.style.removeProperty("--tenant-logo-url");
    Object.entries(config.branding.cssVariables || {}).forEach(([key, value]) => {
      if (/^--[a-z0-9-]+$/i.test(key)) root.style.setProperty(key, String(value));
    });
    window.__DOCLYN_TENANT_CONFIG__ = config;
    window.localStorage.setItem("doclyn-tenant-config", JSON.stringify(config));
    document.title = config.tenant.name || "Doclyn";
  }, [config]);

  const value = useMemo(() => config, [config]);
  return <TenantConfigContext.Provider value={value}>{children}</TenantConfigContext.Provider>;
}
