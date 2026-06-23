"use client";

import { useState } from "react";
import { Bell, CircleUserRound, Menu, Star, X } from "lucide-react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/shared/language-switcher";
import { useMe } from "@/shared/hooks/auth.hooks";

export default function DashboardNavbar() {
    const t = useTranslations("dashboard");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { data: user, isLoading } = useMe();

    const fullName = user?.fullName || "Utilisateur";
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
                        <button className="relative p-2 rounded hover:bg-slate-100">
                            <Bell className="size-5 text-slate-600" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded" />
                        </button>

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
