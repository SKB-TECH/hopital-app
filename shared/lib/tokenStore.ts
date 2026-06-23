const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

function setCookie(name: string, value: string, days = 7) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function getCookie(name: string) {
    if (typeof document === "undefined") return null;

    return (
        document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${name}=`))
            ?.split("=")[1] || null
    );
}

function deleteCookie(name: string) {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export const tokenStore = {
    set(accessToken: string) {
        setCookie(ACCESS_TOKEN_KEY, accessToken);
    },

    get() {
        const token = getCookie(ACCESS_TOKEN_KEY);
        return token ? decodeURIComponent(token) : null;
    },

    setRefresh(refreshToken: string) {
        setCookie(REFRESH_TOKEN_KEY, refreshToken, 30);
    },

    getRefresh() {
        const token = getCookie(REFRESH_TOKEN_KEY);
        return token ? decodeURIComponent(token) : null;
    },

    clear() {
        deleteCookie(ACCESS_TOKEN_KEY);
        deleteCookie(REFRESH_TOKEN_KEY);
    },
};
