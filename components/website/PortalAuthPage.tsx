"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, Eye, Lock, Mail, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/website/BrandLogo";
import { LocalizedLink } from "@/components/website/LocalizedLink";
import { portalService } from "@/shared/services/portal.service";
import { websiteImages } from "@/components/website/website-data";

type Mode = "login" | "register";

function getErrorMessage(error: unknown) {
    if (typeof error === "object" && error && "response" in error) {
        const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
        const message = response?.data?.message;
        return Array.isArray(message) ? message.join(", ") : message;
    }

    return undefined;
}

export default function PortalAuthPage() {
    const router = useRouter();
    const locale = useLocale();
    const searchParams = useSearchParams();
    const initialMode = searchParams.get("mode") === "login" ? "login" : "register";
    const [mode, setMode] = useState<Mode>(initialMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });

    const isLogin = mode === "login";
    const title = isLogin ? "Welcome back" : "Join the community";
    const subtitle = isLogin
        ? "Connectez-vous pour acheter vos billets et suivre vos événements."
        : "Créez votre compte pour réserver, payer et retrouver vos tickets.";

    const actionLabel = useMemo(() => {
        if (isSubmitting) return isLogin ? "Connexion..." : "Création...";
        return isLogin ? "Log In" : "Sign Up";
    }, [isLogin, isSubmitting]);

    const switchMode = (nextMode: Mode) => {
        setMode(nextMode);
        router.replace(`/${locale}/auth?mode=${nextMode}`, { scroll: false });
    };

    const updateField = (key: keyof typeof form, value: string) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!isLogin && form.password !== form.confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas.");
            return;
        }

        setIsSubmitting(true);

        try {
            if (isLogin) {
                await portalService.login({
                    identifier: form.email,
                    password: form.password,
                });
                toast.success("Connexion réussie.");
            } else {
                await portalService.register({
                    fullName: form.fullName,
                    email: form.email,
                    phone: form.phone,
                    password: form.password,
                });
                toast.success("Compte créé avec succès.");
            }

            router.push(`/${locale}/account/tickets`);
        } catch (error) {
            toast.error(getErrorMessage(error) || "Impossible de traiter la demande.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="grid min-h-screen bg-white lg:grid-cols-[0.9fr_1fr]">
            <section className="relative hidden min-h-screen overflow-hidden bg-black text-white lg:block">
                <Image src={websiteImages.hero} alt="Kongo Event" fill className="object-cover opacity-60" priority />
                <div className="absolute inset-0 bg-[#003B5F]/70" />
                <div className="relative z-10 flex h-full flex-col justify-between p-16">
                    <LocalizedLink href="/">
                        <BrandLogo tone="light" />
                    </LocalizedLink>
                    <div>
                        <h1 className="text-6xl font-extrabold leading-tight">
                            Experience the <span className="block text-[#27B7F5]">Unforgettable.</span>
                        </h1>
                        <p className="mt-8 max-w-xl text-xl leading-8 text-white/85">
                            Accédez à vos billets, vos réservations et vos événements favoris depuis le portail public.
                        </p>
                    </div>
                    <div className="w-fit rounded-lg border border-white/30 bg-white/10 px-6 py-5 backdrop-blur">
                        Secure ticketing for attendees
                    </div>
                </div>
            </section>

            <section className="flex items-center justify-center bg-[#F5F7FC] px-6 py-16">
                <div className="w-full max-w-xl">
                    <BrandLogo />
                    <div className="mt-8 inline-flex rounded-xl border border-slate-200 bg-white p-1">
                        <button
                            type="button"
                            onClick={() => switchMode("login")}
                            className={`rounded-lg px-5 py-3 text-sm font-extrabold ${isLogin ? "bg-[#005995] text-white" : "text-slate-600"}`}
                        >
                            Connexion
                        </button>
                        <button
                            type="button"
                            onClick={() => switchMode("register")}
                            className={`rounded-lg px-5 py-3 text-sm font-extrabold ${!isLogin ? "bg-[#005995] text-white" : "text-slate-600"}`}
                        >
                            Inscription
                        </button>
                    </div>

                    <h2 className="mt-6 text-4xl font-extrabold text-[#131827]">{title}</h2>
                    <p className="mt-3 text-slate-600">{subtitle}</p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        {!isLogin && (
                            <AuthField
                                icon={UserRound}
                                label="Full Name"
                                value={form.fullName}
                                onChange={(value) => updateField("fullName", value)}
                                placeholder="John Doe"
                                autoComplete="name"
                                required
                            />
                        )}
                        <AuthField
                            icon={Mail}
                            label={isLogin ? "Email or Phone" : "Email Address"}
                            type={isLogin ? "text" : "email"}
                            value={form.email}
                            onChange={(value) => updateField("email", value)}
                            placeholder={isLogin ? "name@example.com ou +243..." : "name@example.com"}
                            autoComplete={isLogin ? "username" : "email"}
                            required
                        />
                        {!isLogin && (
                            <AuthField
                                icon={Mail}
                                label="Phone"
                                value={form.phone}
                                onChange={(value) => updateField("phone", value)}
                                placeholder="+243810000000"
                                autoComplete="tel"
                            />
                        )}
                        <AuthField
                            icon={Lock}
                            label="Password"
                            type="password"
                            value={form.password}
                            onChange={(value) => updateField("password", value)}
                            placeholder="Password"
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            required
                        />
                        {!isLogin && (
                            <AuthField
                                icon={Eye}
                                label="Confirm Password"
                                type="password"
                                value={form.confirmPassword}
                                onChange={(value) => updateField("confirmPassword", value)}
                                placeholder="Confirm password"
                                autoComplete="new-password"
                                required
                            />
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-full items-center justify-center gap-3 rounded-lg bg-[#005995] py-4 text-xl font-extrabold text-white shadow-sm transition hover:bg-[#004b7d] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {actionLabel}
                            <ArrowRight className="h-5 w-5" />
                        </button>
                    </form>

                    <p className="mt-6 text-center text-slate-600">
                        {isLogin ? "Vous n'avez pas encore de compte ?" : "Already have an account?"}{" "}
                        <button
                            type="button"
                            onClick={() => switchMode(isLogin ? "register" : "login")}
                            className="font-bold text-[#005995]"
                        >
                            {isLogin ? "Créer un compte" : "Log In"}
                        </button>
                    </p>
                </div>
            </section>
        </main>
    );
}

function AuthField({
    icon: Icon,
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    autoComplete,
    required,
}: {
    icon: typeof Mail;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
    autoComplete?: string;
    required?: boolean;
}) {
    return (
        <label className="block">
            <span className="font-bold text-slate-700">{label}</span>
            <span className="mt-3 flex items-center gap-3 rounded-lg bg-white px-4 py-4 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-[#005995]">
                <Icon className="h-5 w-5 text-slate-500" />
                <input
                    className="min-w-0 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
                    type={type}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    required={required}
                />
            </span>
        </label>
    );
}
