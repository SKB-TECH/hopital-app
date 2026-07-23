"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronDown, CircleUserRound, LogOut, Menu, Moon, Settings, Sun, Trash2, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/shared/language-switcher";
import { useLogout, useMe } from "@/shared/hooks/auth.hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/shared/services/notifications.service";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function DashboardNavbar() {
    const locale = useLocale();
    const isEn = locale === "en";
    const router = useRouter();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const queryClient = useQueryClient();
    const { isMobileOpen, openMobileSidebar, closeMobileSidebar } = useSidebar();
    const { isDark, toggleTheme } = useTheme();

    const { data: user, isLoading, isError } = useMe();
    const logout = useLogout();
    const { data: notifications = [] } = useQuery({ queryKey: ["notifications", "list"], queryFn: notificationsService.list, enabled: Boolean(user) });
    const { data: unreadCount = 0 } = useQuery({ queryKey: ["notifications", "unread-count"], queryFn: notificationsService.unreadCount, enabled: Boolean(user), refetchInterval: 60_000 });
    const markAllRead = useMutation({ mutationFn: notificationsService.markAllRead, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notifications"] }); } });
    const removeNotification = useMutation({ mutationFn: notificationsService.remove, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notifications"] }); } });

    useEffect(() => {
        if (!isLoading && (!user || isError)) {
            router.replace(`/${locale}`);
        }
    }, [isError, isLoading, locale, router, user]);

    const fullName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || (isEn ? "User" : "Utilisateur");
    const role =
        Array.isArray(user?.roles) && user.roles.length > 0
            ? String((user.roles[0] as any)?.name || (user.roles[0] as any)?.label || user.roles[0])
            : (isEn ? "Hospital role" : "Rôle hospitalier");
    const roles = Array.isArray(user?.roles) ? user.roles.map((item: any) => String(item?.name || item?.label || item)).join(" · ") : "";

    const handleLogout = () => {
        setProfileOpen(false);
        logout.mutate(undefined, {
            onSettled: () => {
                queryClient.clear();
                router.replace(`/${locale}`);
            },
        });
    };

    return (
        <>
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
                <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => isMobileOpen ? closeMobileSidebar() : openMobileSidebar()}
                        className="lg:hidden p-3 hover:bg-slate-100"
                    >
                        {isMobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>

                    <h1 className="text-base font-semibold text-slate-900 sm:text-xl lg:hidden">Doclyn</h1>

                    <div className="flex items-center gap-4 ml-auto">
                        <button
                            onClick={toggleTheme}
                            className="inline-flex size-10 items-center justify-center border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                            title={isDark ? (isEn ? "Light mode" : "Mode clair") : (isEn ? "Dark mode" : "Mode sombre")}
                        >
                            {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
                        </button>

                        <button onClick={() => setNotificationsOpen((value) => !value)} className="relative p-2 rounded hover:bg-slate-100">
                            <Bell className="size-5 text-slate-600" />
                            {Number(unreadCount) > 0 && <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white">{Number(unreadCount) > 99 ? "99+" : unreadCount}</span>}
                        </button>

                        {notificationsOpen && (
                            <div className="absolute right-20 top-16 z-50 w-[360px] border border-slate-300 bg-white">
                                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                                    <div>
                                        <p className="text-sm font-black text-slate-950">{isEn ? "Notifications" : "Notifications"}</p>
                                        <p className="text-xs font-semibold text-slate-500">{Number(unreadCount)} {isEn ? "unread" : "non lue(s)"}</p>
                                    </div>
                                    <button disabled={markAllRead.isPending || Number(unreadCount) === 0} onClick={() => markAllRead.mutate()} className="text-xs font-black text-blue-700 hover:underline disabled:text-slate-300 disabled:no-underline">{isEn ? "Mark all read" : "Tout marquer lu"}</button>
                                </div>
                                <div className="max-h-[420px] overflow-y-auto">
                                    {notifications.length ? notifications.map((item: any) => (
                                        <div key={item.id} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => item.status !== "READ" && notificationsService.markRead(item.id).then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }))}
                                                    className="min-w-0 flex-1 text-left"
                                                >
                                                    <p className="text-sm font-black text-slate-900">{item.subject || "Notification"}</p>
                                                    <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500">{stripHtml(item.body)}</p>
                                                    <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">{item.channel} · {formatDate(item.createdAt, locale)}</p>
                                                </button>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    {item.status !== "READ" && <span className="size-2 bg-blue-700" />}
                                                    <button
                                                        type="button"
                                                        disabled={removeNotification.isPending}
                                                        onClick={() => removeNotification.mutate(item.id)}
                                                        className="p-1 text-slate-400 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                                                        title={isEn ? "Delete" : "Supprimer"}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )) : <p className="p-5 text-sm font-semibold text-slate-500">{isEn ? "No notification." : "Aucune notification."}</p>}
                                </div>
                            </div>
                        )}

                        <button onClick={() => setProfileOpen((value) => !value)} className="relative flex items-center gap-3 border border-transparent px-2 py-1.5 hover:border-slate-200 hover:bg-slate-50">
                            <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center overflow-hidden">
                                {user?.avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={user.avatarUrl}
                                        alt={fullName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <CircleUserRound className="size-4 text-blue-600" />
                                )}
                            </div>

                            <div className="hidden sm:block">
                                <p className="text-left text-sm font-semibold text-slate-900">
                                    {isLoading ? (isEn ? "Loading..." : "Chargement...") : fullName}
                                </p>
                                <p className="text-left text-xs text-slate-500">
                                    {isLoading ? "" : role}
                                </p>
                            </div>
                            <ChevronDown className="hidden size-4 text-slate-400 sm:block" />
                        </button>

                        {profileOpen && (
                            <div className="absolute right-6 top-16 z-50 w-[300px] border border-slate-300 bg-white">
                                <div className="border-b border-slate-200 px-4 py-4">
                                    <p className="text-sm font-semibold text-slate-950">{fullName}</p>
                                    <p className="mt-1 break-all text-xs text-slate-500">{user?.email}</p>
                                    {roles && <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-blue-700">{roles}</p>}
                                </div>
                                <button
                                    onClick={() => { setProfileOpen(false); router.push(`/${locale}/settings`); }}
                                    className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    <Settings className="size-4" />
                                    {isEn ? "My account" : "Mon compte"}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    disabled={logout.isPending}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                >
                                    <LogOut className="size-4" />
                                    {logout.isPending ? (isEn ? "Signing out..." : "Déconnexion...") : (isEn ? "Sign out" : "Déconnexion")}
                                </button>
                            </div>
                        )}

                        <LanguageSwitcher />
                    </div>
                </div>
            </header>
        </>
    );
}

function stripHtml(value?: string) {
    return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(value?: string, locale = "fr") {
    if (!value) return "";
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
