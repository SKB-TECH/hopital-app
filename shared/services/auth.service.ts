import { api } from "@/shared/lib/http/api";
import { tokenStore } from "@/shared/lib/tokenStore";
import type { HospitalLoginPayload, RefreshTokenPayload } from "../types/auth.types";

type HospitalAuthResponse = { accessToken: string; refreshToken: string; user?: unknown };
function saveAuthTokens(data: HospitalAuthResponse) {
  if (data?.accessToken) tokenStore.set(data.accessToken);
  if (data?.refreshToken) tokenStore.setRefresh(data.refreshToken);
}

export const authService = {
  async login(payload: HospitalLoginPayload): Promise<HospitalAuthResponse> {
    const res = await api.post("/auth/login", payload, { skipAuth: true } as any);
    saveAuthTokens(res.data);
    return res.data;
  },
  async refreshToken(payload?: RefreshTokenPayload): Promise<HospitalAuthResponse> {
    const refreshToken = payload?.refreshToken || tokenStore.getRefresh();
    const res = await api.post("/auth/refresh", { refreshToken }, { skipAuth: true } as any);
    saveAuthTokens(res.data);
    return res.data;
  },
  async logout(): Promise<void> {
    try { await api.post("/auth/logout", {}); }
    finally { tokenStore.clear(); if (typeof window !== "undefined") localStorage.removeItem("auth_user"); }
  },
  async me(): Promise<any> {
    if (!tokenStore.get()) return null;
    const res = await api.get("/auth/me");
    return res.data;
  },
  async register(_payload?: any): Promise<never> { throw new Error("La création des comptes se fait par Administration > Utilisateurs."); },
  async forgotPassword(_payload?: any): Promise<{ message: string }> { return { message: "Réinitialisation à connecter au service mail hôpital." }; },
  async sendOtp(_payload?: any): Promise<{ message: string }> { return { message: "OTP non activé." }; },
  async verifyOtp(_payload?: any): Promise<any> { return { verified: false }; },
  async resetPassword(_payload?: any): Promise<{ message: string }> { return { message: "Réinitialisation à connecter." }; },
  async resendSms(_payload?: any): Promise<{ message: string }> { return { message: "SMS non activé." }; },
};
