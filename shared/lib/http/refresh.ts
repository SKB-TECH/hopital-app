import axios from "axios";
import { tokenStore } from "@/shared/lib/tokenStore";

const DEFAULT_API_URL = "/api/proxy/api/v1";
const refreshClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL,
  withCredentials: true,
});

export async function refreshAccessToken() {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) throw new Error("Refresh token manquant");
  const response = await refreshClient.post("/auth/refresh", { refreshToken }, { skipAuth: true } as any);
  const accessToken = response.data?.accessToken;
  const nextRefreshToken = response.data?.refreshToken;
  if (!accessToken) throw new Error("Token invalide");
  tokenStore.set(accessToken);
  if (nextRefreshToken) tokenStore.setRefresh(nextRefreshToken);
  return accessToken;
}
