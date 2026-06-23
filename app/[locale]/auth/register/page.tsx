"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Building2, CheckCircle2, Eye, EyeOff, Ticket, UserRound } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { useRegister, useRegisterOrganizer } from "@/shared/hooks/auth.hooks";
import type { OrganizerBusinessType } from "@/shared/types/auth.types";
import Image from "next/image";

type AccountType = "ATTENDEE" | OrganizerBusinessType;

const accountTypes: Array<{
    value: AccountType;
    icon: typeof UserRound;
}> = [
    { value: "ATTENDEE", icon: UserRound },
    { value: "EVENT_ORGANIZER", icon: Building2 },
    { value: "TICKETING_SELLER", icon: Ticket },
    { value: "TRAVEL_SELLER", icon: Building2 },
    { value: "HOTEL_SELLER", icon: Building2 },
    { value: "VOUCHER_SELLER", icon: Ticket },
    { value: "FULL_PLATFORM", icon: CheckCircle2 },
];

export default function RegisterPage() {
    const t = useTranslations("auth.register");
    const router = useRouter();
    const locale = useLocale();
    const [showPassword, setShowPassword] = useState(false);
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [accountType, setAccountType] = useState<AccountType>("EVENT_ORGANIZER");

    const register = useRegister();
    const registerOrganizer = useRegisterOrganizer();
    const isOrganizerAccount = accountType !== "ATTENDEE";
    const isPending = register.isPending || registerOrganizer.isPending;

    const canSubmit =
        fullName.trim() &&
        email.trim() &&
        phone.trim() &&
        password.trim() &&
        (!isOrganizerAccount || businessName.trim()) &&
        !isPending;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!fullName.trim()) {
            toast.warning(t("requiredTitle"), { description: t("fullNameRequired") });
            return;
        }

        if (!email.trim()) {
            toast.warning(t("requiredTitle"), { description: t("emailRequired") });
            return;
        }

        if (!phone.trim()) {
            toast.warning(t("requiredTitle"), { description: t("phoneRequired") });
            return;
        }

        if (!password.trim()) {
            toast.warning(t("requiredTitle"), { description: t("passwordRequired") });
            return;
        }

        if (isOrganizerAccount && !businessName.trim()) {
            toast.warning(t("requiredTitle"), { description: t("businessNameRequired") });
            return;
        }

        const onSuccess = () => {
            toast.success(t("successTitle"), { description: t("successDescription") });
            router.push(isOrganizerAccount ? `/${locale}/overview` : `/${locale}/account/tickets`);
        };

        const onError = (error: any) => {
            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                t("errorDescription");

            toast.error(t("errorTitle"), {
                description: Array.isArray(message) ? message.join(", ") : message,
            });
        };

        const payload = {
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password,
        };

        if (isOrganizerAccount) {
            registerOrganizer.mutate(
                {
                    ...payload,
                    businessName: businessName.trim(),
                    businessType: accountType,
                },
                { onSuccess, onError }
            );
            return;
        }

        register.mutate(payload, { onSuccess, onError });
    };

    return (
        <AuthShell>
            <div className="w-full max-w-[500px] rounded bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded bg-blue-50">
                    <Image src="/images/logo.jpeg" alt="logo" width={100} height={100} />
                </div>

                <div className="text-center">
                    <h1 className="text-[22px] font-extrabold text-slate-900">
                        {t("title")}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">{t("description")}</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                    <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                            {t("accountType")} <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {accountTypes.map((type) => {
                                const Icon = type.icon;
                                const active = accountType === type.value;
                                return (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setAccountType(type.value)}
                                        className={`flex min-h-14 items-center gap-3 rounded border px-3 text-left text-sm transition ${
                                            active
                                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"
                                        }`}
                                    >
                                        <Icon className="size-4 shrink-0" />
                                        <span className="font-semibold">{t(`accountTypes.${type.value}`)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {isOrganizerAccount ? (
                        <Field
                            label={t("businessName")}
                            value={businessName}
                            onChange={setBusinessName}
                            placeholder={t("businessNamePlaceholder")}
                        />
                    ) : null}

                    <Field
                        label={t("fullName")}
                        value={fullName}
                        onChange={setFullName}
                        placeholder={t("fullNamePlaceholder")}
                    />

                    <Field
                        label={t("email")}
                        value={email}
                        onChange={setEmail}
                        placeholder={t("emailPlaceholder")}
                        type="email"
                    />

                    <Field
                        label={t("phone")}
                        value={phone}
                        onChange={setPhone}
                        placeholder={t("phonePlaceholder")}
                        type="tel"
                    />

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
                                {showPassword ? (
                                    <EyeOff className="size-4" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="flex h-12 w-full items-center justify-center rounded bg-blue-600 text-sm font-semibold text-white disabled:bg-blue-200"
                    >
                        {isPending ? (
                            <span className="size-5 animate-spin rounded border-2 border-white/40 border-t-white" />
                        ) : (
                            isOrganizerAccount ? t("submitOrganizer") : t("submit")
                        )}
                    </button>
                </form>

                <p className="mt-7 text-center text-sm text-slate-500">
                    {t("hasAccount")}{" "}
                    <a href="../login" className="font-semibold text-blue-600">
                        {t("login")}
                    </a>
                </p>
            </div>
        </AuthShell>
    );
}

function Field({
                   label,
                   placeholder,
                   value,
                   onChange,
                   type = "text",
               }: {
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
}) {
    return (
        <div>
            <label className="mb-2 block text-xs font-semibold text-slate-700">
                {label} <span className="text-red-500">*</span>
            </label>

            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-12 w-full rounded border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
        </div>
    );
}
