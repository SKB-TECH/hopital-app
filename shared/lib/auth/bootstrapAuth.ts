import {authService} from "@/shared/services/auth.service";
import {tokenStore} from "@/shared/lib/tokenStore";
import {refreshAccessToken} from "@/shared/lib/http/refresh";


export async function bootstrapAuth() {
    try {
        if (!tokenStore.get()) {
            await refreshAccessToken();
        }

        return await authService.me();
    } catch {
        tokenStore.clear();
        return null;
    }
}
