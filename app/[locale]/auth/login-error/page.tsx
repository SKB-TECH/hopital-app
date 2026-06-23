"use client";

import { useState } from "react";
import { Eye, EyeOff, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import AuthShell from "@/components/auth/AuthShell";

export default function LoginErrorPage() {
    const t = useTranslations("auth.login");
    const [showPassword, setShowPassword] = useState(false);

    return (
        <AuthShell>
            <div className="w-full max-w-[430px] rounded bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded bg-blue-50">
                    <div className="flex size-9 items-center justify-center rounded border border-blue-100 bg-white text-blue-600 shadow-sm">
                        <UserRound className="size-4" />
                    </div>
                </div>

                <div className="text-center">
                    <h1 className="text-[22px] font-extrabold text-slate-900">
                        {t("title")}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">{t("description")}</p>
                </div>

                <form className="mt-7 space-y-4">
                    <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                            {t("email")} <span className="text-red-500">*</span>
                        </label>
                        <input
                            defaultValue="johndoe@example.com"
                            className="h-10 w-full rounded border border-red-400 bg-red-50 px-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
                        />
                        <p className="mt-2 text-xs font-medium text-red-500">
                            {t("emailError")}
                        </p>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                            {t("password")} <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                defaultValue="123456789"
                                className="h-10 w-full rounded border border-slate-200 bg-white px-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center gap-2 text-slate-500">
                            <input type="checkbox" />
                            {t("remember")}
                        </label>

                        <a href="../forgot-password" className="font-semibold text-blue-600">
                            {t("forgot")}
                        </a>
                    </div>

                    <button className="h-11 w-full rounded bg-blue-600 text-sm font-semibold text-white">
                        {t("submit")}
                    </button>
                </form>

                <p className="mt-7 text-center text-sm text-slate-500">
                    {t("noAccount")}{" "}
                    <a href="../register" className="font-semibold text-blue-600">
                        {t("register")}
                    </a>
                </p>
            </div>
        </AuthShell>
    );
}
