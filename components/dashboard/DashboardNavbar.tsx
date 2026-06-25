"use client";

import { useEffect, useState } from "react";
import { Bell, CircleUserRound, Menu, Star, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/shared/language-switcher";
import { useMe } from "@/shared/hooks/auth.hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/shared/services/notifications.service";

export default function DashboardNavbar() {
    const t = useTranslations("dashboard");
    const locale = useLocale();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: user, isLoading, isError } = useMe();
    const { data: notifications = [] } = useQuery({ queryKey: ["notifications", "list"], queryFn: notificationsService.list, enabled: Boolean(user) });
    const { data: unreadCount = 0 } = useQuery({ queryKey: ["notifications", "unread-count"], queryFn: notificationsService.unreadCount, enabled: Boolean(user), refetchInterval: 60_000 });
    const markAllRead = useMutation({ mutationFn: notificationsService.markAllRead, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notifications"] }); } });

    useEffect(() => {
        if (!isLoading && (!user || isError)) {
            router.replace(`/${locale}`);
        }
    }, [isError, isLoading, locale, router, user]);

    const fullName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Utilisateur";
    const role =
        Array.isArray(user?.roles) && user.roles.length > 0
            ? String((user.roles[0] as any)?.name || (user.roles[0] as any)?.label || user.roles[0])
            : t("roleHospital");

    return (
        <>
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
                <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden p-2 rounded hover:bg-slate-100"
                    >
                        {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>

                    <h1 className="text-xl font-bold text-slate-900 lg:hidden">Afia Hospital</h1>

                    <div className="flex items-center gap-4 ml-auto">
                        <button onClick={() => setNotificationsOpen((value) => !value)} className="relative p-2 rounded hover:bg-slate-100">
                            <Bell className="size-5 text-slate-600" />
                            {Number(unreadCount) > 0 && <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white">{Number(unreadCount) > 99 ? "99+" : unreadCount}</span>}
                        </button>

                        {notificationsOpen && (
                            <div className="absolute right-20 top-16 z-50 w-[360px] border border-slate-300 bg-white">
                                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                                    <div>
                                        <p className="text-sm font-black text-slate-950">Notifications</p>
                                        <p className="text-xs font-semibold text-slate-500">{Number(unreadCount)} non lue(s)</p>
                                    </div>
                                    <button onClick={() => markAllRead.mutate()} className="text-xs font-black text-blue-700 hover:underline">Tout marquer lu</button>
                                </div>
                                <div className="max-h-[420px] overflow-y-auto">
                                    {notifications.length ? notifications.map((item: any) => (
                                        <div key={item.id} className="border-b border-slate-100 px-4 py-3 last:border-b-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{item.subject || "Notification"}</p>
                                                    <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500">{stripHtml(item.body)}</p>
                                                    <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">{item.channel} · {formatDate(item.createdAt)}</p>
                                                </div>
                                                {item.status !== "READ" && <span className="mt-1 size-2 shrink-0 bg-blue-700" />}
                                            </div>
                                        </div>
                                    )) : <p className="p-5 text-sm font-semibold text-slate-500">Aucune notification.</p>}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
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
                                <p className="text-sm font-semibold text-slate-900">
                                    {isLoading ? "Chargement..." : fullName}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {isLoading ? "" : role}
                                </p>
                            </div>
                        </div>

                        <LanguageSwitcher />
                    </div>
                </div>
            </header>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-30 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
                        <div className="p-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded bg-blue-600 text-white">
                                    <CircleUserRound className="size-5" />
                                </div>
                                <span className="font-bold text-lg">Afia Hospital</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function stripHtml(value?: string) {
    return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(value?: string) {
    if (!value) return "";
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
