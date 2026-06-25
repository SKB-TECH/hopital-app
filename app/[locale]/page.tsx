"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, EyeOff, HelpCircle, ScrollText, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useLogin } from "@/shared/hooks/auth.hooks";
import { tokenStore } from "@/shared/lib/tokenStore";

export default function LoginPage() {
    const t = useTranslations("auth.login");
    const locale = useLocale();
    const router = useRouter();

    const overviewPath = `/${locale}/overview`;

    const [showPassword, setShowPassword] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    const { mutate, isPending } = useLogin();

    useEffect(() => {
        const token = tokenStore.get();

        if (token) {
            router.replace(overviewPath);
        }
    }, [router, overviewPath]);

    const canSubmit = identifier.trim() && password.trim() && !isPending;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!identifier.trim()) {
            toast.warning("Champ obligatoire", {
                description: "Veuillez saisir votre email ou téléphone.",
            });
            return;
        }

        if (!password.trim()) {
            toast.warning("Champ obligatoire", {
                description: "Veuillez saisir votre mot de passe.",
            });
            return;
        }

        mutate(
            {
                email: identifier.trim(),
                password,
            },
            {
                onSuccess: () => {
                    toast.success("Connexion réussie", {
                        description: "Redirection vers votre espace...",
                    });

                    router.replace(overviewPath);
                },
                onError: (error: any) => {
                    const message =
                        error?.response?.data?.message ||
                        error?.response?.data?.error ||
                        error?.message ||
                        "Une erreur est survenue. Veuillez réessayer.";

                    toast.error("Connexion échouée", {
                        description: Array.isArray(message) ? message.join(", ") : message,
                    });
                },
            }
        );
    };

    return (
        <main className="min-h-screen bg-slate-100">
            <section
                className="relative mx-auto flex min-h-screen flex-col overflow-hidden rounded border border-slate-200 bg-[#f8f9fc]"
                style={{
                    backgroundImage: "radial-gradient(#cfd5e2 1px, transparent 1px)",
                    backgroundSize: "18px 18px",
                }}
            >
                <div className="flex flex-1 items-center justify-center px-4 py-10">
                    <div className="w-full max-w-[500px] rounded bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                        <div className="mx-auto mt-3  mb-5 flex size-14 items-center justify-center w-full">
                            <Image src="/logo.png" alt="logo" width={300} height={300} />
                        </div>

                        <div className="text-center">
                            <h1 className="text-[22px] font-extrabold text-slate-900">{t("title")}</h1>
                            <p className="mt-2 text-sm text-slate-500">{t("description")}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                            <div>
                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                    {t("email")} <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder={t("emailPlaceholder")}
                                    className="h-12 w-full rounded border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-slate-700">
                                    {t("password")} <span className="text-red-500">*</span>
                                </label>

                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t("passwordPlaceholder")}
                                        className="h-12 w-full rounded border border-slate-200 bg-white px-3 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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

                                <a href={`/${locale}/auth/forgot-password`} className="font-semibold text-blue-600">
                                    {t("forgot")}
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="flex h-12 w-full items-center justify-center rounded bg-blue-600 text-sm font-semibold text-white disabled:bg-blue-200"
                            >
                                {isPending ? (
                                    <span className="size-5 animate-spin rounded border-2 border-white/40 border-t-white" />
                                ) : (
                                    t("submit")
                                )}
                            </button>
                        </form>

                        <p className="mt-7 text-center text-sm text-slate-500">
                            {t("noAccount")}{" "}
                            <a href={`/${locale}/auth/register`} className="font-semibold text-blue-600">
                                {t("register")}
                            </a>
                        </p>
                    </div>
                </div>

                <footer className="flex flex-col gap-3 px-6 pb-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
                    <p>© 2026 Afia Smart. All right reserved.</p>

                    <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" />
              Privacy
            </span>

                        <span className="inline-flex items-center gap-1.5">
              <ScrollText className="size-3.5" />
              Terms
            </span>

                        <span className="inline-flex items-center gap-1.5">
              <HelpCircle className="size-3.5" />
              Get help
            </span>
                    </div>
                </footer>
            </section>
        </main>
    );
}
