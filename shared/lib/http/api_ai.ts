import axios from "axios";
import { refreshAccessToken } from "@/shared/lib/http/refresh";
import { authEvents } from "@/shared/lib/auth/authEvents";
import { tokenStore } from "@/shared/lib/tokenStore";

export const aiApi = axios.create({
    baseURL: "/api/ai",
    withCredentials: true,
});

aiApi.interceptors.request.use((config: any) => {
    if (config.skipAuth) return config;

    const token = tokenStore.get();

    config.headers = config.headers ?? {};

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

aiApi.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;

        if (!error.response) return Promise.reject(error);
        if (original?.url?.includes("/auth/refresh")) return Promise.reject(error);

        if (error.response.status === 401 && original && !original._retry) {
            original._retry = true;

            try {
                const newToken = await refreshAccessToken();
                original.headers = original.headers ?? {};
                original.headers.Authorization = `Bearer ${newToken}`;
                return aiApi(original);
            } catch {
                tokenStore.clear();
                authEvents.emitLogout();
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    },
);
