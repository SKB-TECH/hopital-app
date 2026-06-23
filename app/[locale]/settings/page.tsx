"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Bell,
    CheckCircle2,
    ChevronDown,
    CircleDollarSign,
    CreditCard,
    Eye,
    EyeOff,
    Globe2,
    LinkIcon,
    LockKeyhole,
    PackageCheck,
    Save,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSidebar } from "@/contexts/SidebarContext";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { api } from "@/shared/lib/http/api";

type SettingsTab =
    | "general"
    | "modules"
    | "plan"
    | "account"
    | "billing"
    | "tax"
    | "link"
    | "language"
    | "password"
    | "notifications";

export default function SettingsPage() {
    const t = useTranslations("settings");
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");
    const { isCollapsed } = useSidebar();

    const tabs = useMemo(
        () => [
            { key: "general" as const, label: t("tabs.general") },
            { key: "modules" as const, label: t("tabs.modules") },
            { key: "plan" as const, label: t("tabs.plan") },
            { key: "account" as const, label: t("tabs.account") },
            { key: "billing" as const, label: t("tabs.billing") },
            { key: "tax" as const, label: t("tabs.tax") },
            { key: "link" as const, label: t("tabs.link") },
            { key: "language" as const, label: t("tabs.language") },
            { key: "password" as const, label: t("tabs.password") },
            { key: "notifications" as const, label: t("tabs.notifications") },
        ],
        [t]
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <DashboardSidebar />

            <div className={`transition-all duration-300 ${
                isCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"
            }`}>
                <DashboardNavbar />

                <main className="p-4 sm:p-6 lg:p-8">
                    {/* Header */}
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-950">
                                {t("title")}
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                {t("breadcrumbOther")} / <span className="text-slate-900 font-medium">{t("title")}</span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button className="px-5 py-2.5 rounded border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                                {t("cancel")}
                            </button>
                            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all hover:shadow-md">
                                <Save className="size-4" />
                                {t("save")}
                            </button>
                        </div>
                    </div>

                    {/* Settings Container */}
                    <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
                        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
                            {/* Sidebar Tabs */}
                            <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r bg-slate-50/30">
                                <div className="p-4">
                                    <div className="flex gap-2 overflow-x-auto lg:block lg:space-y-1 pb-2 lg:pb-0">
                                        {tabs.map((tab) => (
                                            <button
                                                key={tab.key}
                                                onClick={() => setActiveTab(tab.key)}
                                                className={`shrink-0 rounded px-4 py-2.5 text-left text-sm font-semibold transition-all lg:w-full ${
                                                    activeTab === tab.key
                                                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                                                        : "text-slate-600 hover:bg-white/50"
                                                }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </aside>

                            {/* Content */}
                            <section className="min-h-[600px] p-5 lg:p-8">
                                {activeTab === "general" && <GeneralSection t={t} />}
                                {activeTab === "modules" && <ModulesSection t={t} />}
                                {activeTab === "plan" && <PlanSection t={t} />}
                                {activeTab === "account" && <AccountSection t={t} />}
                                {activeTab === "billing" && <BillingSection t={t} />}
                                {activeTab === "tax" && <TaxSection t={t} />}
                                {activeTab === "link" && <LinkAccountSection t={t} />}
                                {activeTab === "language" && <LanguageSection t={t} />}
                                {activeTab === "password" && <PasswordSection t={t} />}
                                {activeTab === "notifications" && <NotificationsSection t={t} />}
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

// ==================== Section Header Component ====================
function SectionHeader({
                           icon,
                           title,
                           description,
                       }: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="mb-8 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="flex size-10 items-center justify-center rounded bg-blue-50 text-blue-600">
                    {icon}
                </div>
                <div>
                    <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
            </div>
        </div>
    );
}

// ==================== Form Components ====================
function Field({
                   label,
                   required,
                   children,
                   helpText,
               }: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    helpText?: string;
}) {
    return (
        <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {helpText && <p className="mt-1 text-xs text-slate-400">{helpText}</p>}
        </div>
    );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-slate-300"
        />
    );
}

function Select({
                    defaultValue,
                    value,
                    children,
                    onChange,
                }: {
    defaultValue?: string;
    value?: string;
    children: React.ReactNode;
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
    return (
        <div className="relative">
            <select
                defaultValue={defaultValue}
                value={value}
                onChange={onChange}
                className="h-11 w-full appearance-none rounded border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-slate-300"
            >
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        </div>
    );
}

// ==================== Modules Section ====================
type ModuleSettings = {
    events: boolean;
    ticketing: boolean;
    marketplace: boolean;
    buses: boolean;
    flights: boolean;
    vouchers: boolean;
    stay: boolean;
    sponsors: boolean;
    reports: boolean;
    payouts: boolean;
    reviews: boolean;
};

const defaultModuleSettings: ModuleSettings = {
    events: true,
    ticketing: true,
    marketplace: false,
    buses: false,
    flights: false,
    vouchers: false,
    stay: false,
    sponsors: false,
    reports: true,
    payouts: true,
    reviews: false,
};

function ModulesSection({ t }: { t: any }) {
    const [modules, setModules] = useState<ModuleSettings>(defaultModuleSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        api.get("/settings/me/modules")
            .then((response) => {
                if (!mounted) return;
                setModules({ ...defaultModuleSettings, ...pickModuleSettings(response.data) });
            })
            .catch(() => {
                if (mounted) setError(t("modules.loadError"));
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [t]);

    const toggle = (key: keyof ModuleSettings) => {
        setMessage("");
        setError("");
        setModules((current) => ({ ...current, [key]: !current[key] }));
    };

    const save = async () => {
        setSaving(true);
        setMessage("");
        setError("");
        try {
            const response = await api.patch("/settings/me/modules", modules);
            setModules({ ...defaultModuleSettings, ...pickModuleSettings(response.data) });
            window.dispatchEvent(new CustomEvent("kongo:modules-updated", { detail: modules }));
            setMessage(t("modules.saveSuccess"));
        } catch {
            setError(t("modules.saveError"));
        } finally {
            setSaving(false);
        }
    };

    const items: Array<{ key: keyof ModuleSettings; title: string; description: string }> = [
        { key: "events", title: t("modules.items.events.title"), description: t("modules.items.events.description") },
        { key: "ticketing", title: t("modules.items.ticketing.title"), description: t("modules.items.ticketing.description") },
        { key: "marketplace", title: t("modules.items.marketplace.title"), description: t("modules.items.marketplace.description") },
        { key: "buses", title: t("modules.items.buses.title"), description: t("modules.items.buses.description") },
        { key: "flights", title: t("modules.items.flights.title"), description: t("modules.items.flights.description") },
        { key: "vouchers", title: t("modules.items.vouchers.title"), description: t("modules.items.vouchers.description") },
        { key: "stay", title: t("modules.items.stay.title"), description: t("modules.items.stay.description") },
        { key: "sponsors", title: t("modules.items.sponsors.title"), description: t("modules.items.sponsors.description") },
        { key: "reports", title: t("modules.items.reports.title"), description: t("modules.items.reports.description") },
        { key: "payouts", title: t("modules.items.payouts.title"), description: t("modules.items.payouts.description") },
        { key: "reviews", title: t("modules.items.reviews.title"), description: t("modules.items.reviews.description") },
    ];

    return (
        <div>
            <SectionHeader
                icon={<PackageCheck className="size-5" />}
                title={t("modules.title")}
                description={t("modules.description")}
            />

            <div className="space-y-5">
                {loading && <StatusBox>{t("modules.loading")}</StatusBox>}
                {message && <StatusBox tone="success">{message}</StatusBox>}
                {error && <StatusBox tone="error">{error}</StatusBox>}

                <div className="grid gap-4 md:grid-cols-2">
                    {items.map((item) => (
                        <div key={item.key} className="flex items-start justify-between gap-4 rounded border border-slate-200 bg-white p-4">
                            <div>
                                <h3 className="font-extrabold text-slate-900">{item.title}</h3>
                                <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                            </div>
                            <Toggle enabled={modules[item.key]} onChange={() => toggle(item.key)} />
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={save}
                    disabled={loading || saving}
                    className="inline-flex items-center gap-2 rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Save className="size-4" />
                    {saving ? t("modules.saving") : t("modules.save")}
                </button>
            </div>
        </div>
    );
}

function pickModuleSettings(data: any): Partial<ModuleSettings> {
    return Object.fromEntries(
        Object.keys(defaultModuleSettings)
            .filter((key) => typeof data?.[key] === "boolean")
            .map((key) => [key, data[key]])
    ) as Partial<ModuleSettings>;
}

function StatusBox({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "error" }) {
    const classes = {
        neutral: "border-slate-200 bg-slate-50 text-slate-600",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        error: "border-rose-200 bg-rose-50 text-rose-700",
    };

    return <div className={`rounded border p-4 text-sm font-semibold ${classes[tone]}`}>{children}</div>;
}

// ==================== General Section ====================
function GeneralSection({ t }: { t: any }) {
    return (
        <div>
            <SectionHeader
                icon={<UserRound className="size-5" />}
                title={t("general.title")}
                description={t("general.description")}
            />

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label={t("general.companyName")} required>
                        <Input defaultValue="Kongo Event" />
                    </Field>

                    <Field label={t("general.industry")} required>
                        <Select defaultValue="music">
                            <option value="music">Music & Entertainment</option>
                            <option value="business">Business & Conference</option>
                            <option value="sport">Sports</option>
                            <option value="education">Education</option>
                        </Select>
                    </Field>

                    <Field label={t("general.currency")} required>
                        <Select defaultValue="usd">
                            <option value="usd">US Dollar (USD)</option>
                            <option value="cdf">Congolese Franc (CDF)</option>
                            <option value="eur">Euro (EUR)</option>
                        </Select>
                    </Field>

                    <Field label={t("general.timezone")} required>
                        <Select defaultValue="cat">
                            <option value="pst">Pacific Standard Time (PST)</option>
                            <option value="est">Eastern Standard Time (EST)</option>
                            <option value="cat">Central Africa Time (CAT)</option>
                            <option value="utc">UTC</option>
                        </Select>
                    </Field>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-lg font-extrabold text-slate-900 mb-4">{t("general.address")}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label={t("general.addressName")} required>
                            <Input defaultValue="Main Office" />
                        </Field>

                        <Field label={t("general.country")} required>
                            <Select defaultValue="cd">
                                <option value="us">United States</option>
                                <option value="cd">DR Congo</option>
                                <option value="fr">France</option>
                                <option value="be">Belgium</option>
                            </Select>
                        </Field>

                        <Field label={t("general.city")} required>
                            <Input defaultValue="Kinshasa" />
                        </Field>

                        <Field label={t("general.postalCode")} required>
                            <Input defaultValue="KIN+243" />
                        </Field>

                        <Field label={t("general.addressLine")} required>
                            <Input defaultValue="123 Avenue de la République, Gombe" />
                        </Field>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==================== Plan Section ====================
function PlanSection({ t }: { t: any }) {
    const [selectedPlan, setSelectedPlan] = useState("pro");

    const plans = [
        {
            id: "basic",
            name: "Basic Plan",
            price: "$24",
            period: "month",
            badge: "Popular",
            features: [
                "Up to 2 staff members",
                "Basic analytics",
                "Email support",
                "100 tickets per event",
            ]
        },
        {
            id: "pro",
            name: "Pro Plan",
            price: "$64",
            period: "month",
            badge: "Current Plan",
            features: [
                "Up to 10 staff members",
                "Advanced analytics",
                "Priority support",
                "Unlimited tickets",
                "Fraud analysis",
                "Custom branding",
            ]
        },
        {
            id: "enterprise",
            name: "Enterprise",
            price: "$124",
            period: "month",
            badge: "Best Value",
            features: [
                "Unlimited staff members",
                "Custom analytics",
                "24/7 dedicated support",
                "Unlimited tickets",
                "Advanced fraud protection",
                "API access",
                "White-label solution",
            ]
        },
    ];

    return (
        <div>
            <SectionHeader
                icon={<CircleDollarSign className="size-5" />}
                title={t("plan.title")}
                description={t("plan.description")}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`rounded border p-6 transition-all cursor-pointer hover:shadow-lg ${
                            selectedPlan === plan.id
                                ? "border-blue-500 bg-blue-50/20 ring-2 ring-blue-500/20"
                                : "border-slate-200 hover:border-slate-300"
                        }`}
                        onClick={() => setSelectedPlan(plan.id)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
                            <span className="rounded bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                {plan.badge}
                            </span>
                        </div>

                        <div className="mb-4">
                            <p className="text-3xl font-extrabold text-slate-900">
                                {plan.price}
                                <span className="ml-1 text-sm font-medium text-slate-500">/{plan.period}</span>
                            </p>
                        </div>

                        <div className="space-y-2 mb-6">
                            {plan.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                                    <CheckCircle2 className="size-4 text-blue-600 shrink-0" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <button className={`w-full py-2.5 rounded text-sm font-semibold transition-all ${
                            selectedPlan === plan.id
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}>
                            {selectedPlan === plan.id ? "Current Plan" : "Upgrade"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==================== Account Section ====================
function AccountSection({ t }: { t: any }) {
    return (
        <div>
            <SectionHeader
                icon={<UserRound className="size-5" />}
                title={t("account.title")}
                description={t("account.description")}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label={t("account.firstName")} required>
                    <Input defaultValue="Robert" />
                </Field>

                <Field label={t("account.lastName")} required>
                    <Input defaultValue="Johnson" />
                </Field>

                <Field label={t("account.email")} required>
                    <Input type="email" defaultValue="robert@kongoevent.com" />
                </Field>

                <Field label={t("account.phone")} required>
                    <Input type="tel" defaultValue="+243 123 456 789" />
                </Field>

                <Field label={t("account.role")}>
                    <Input defaultValue="Organization Administrator" disabled className="bg-slate-50" />
                </Field>

                <Field label={t("account.memberSince")}>
                    <Input defaultValue="January 15, 2024" disabled className="bg-slate-50" />
                </Field>
            </div>
        </div>
    );
}

// ==================== Billing Section ====================
type PayoutAccountForm = {
    preferredMethod: "BANK_TRANSFER" | "MOBILE_MONEY";
    accountHolderName: string;
    bankName: string;
    bankAccountNumber: string;
    bankRoutingNumber: string;
    bankSwiftCode: string;
    bankIban: string;
    mobileProvider: string;
    mobileNumber: string;
    country: string;
    currency: string;
    status?: string;
};

const emptyPayoutForm: PayoutAccountForm = {
    preferredMethod: "MOBILE_MONEY",
    accountHolderName: "",
    bankName: "",
    bankAccountNumber: "",
    bankRoutingNumber: "",
    bankSwiftCode: "",
    bankIban: "",
    mobileProvider: "MAXICASH",
    mobileNumber: "",
    country: "CD",
    currency: "USD",
    status: "PENDING",
};

function BillingSection({ t }: { t: any }) {
    const [form, setForm] = useState<PayoutAccountForm>(emptyPayoutForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        api.get("/settings/me/payout-account")
            .then((response) => {
                if (!mounted) return;
                setForm({ ...emptyPayoutForm, ...normalizePayoutAccount(response.data) });
            })
            .catch(() => {
                if (mounted) setError(t("billing.loadError"));
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [t]);

    const update = (name: keyof PayoutAccountForm, value: string) => {
        setMessage("");
        setError("");
        setForm((current) => ({ ...current, [name]: value }));
    };

    const save = async () => {
        setSaving(true);
        setMessage("");
        setError("");
        try {
            const payload = cleanPayoutPayload(form);
            const response = await api.patch("/settings/me/payout-account", payload);
            setForm({ ...emptyPayoutForm, ...normalizePayoutAccount(response.data) });
            setMessage(t("billing.saveSuccess"));
        } catch {
            setError(t("billing.saveError"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <SectionHeader
                icon={<CreditCard className="size-5" />}
                title={t("billing.title")}
                description={t("billing.description")}
            />

            <div className="space-y-6">
                {loading && (
                    <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                        {t("billing.loading")}
                    </div>
                )}

                {message && (
                    <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="rounded border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label={t("billing.preferredMethod")} required>
                        <Select value={form.preferredMethod} onChange={(event) => update("preferredMethod", event.target.value as PayoutAccountForm["preferredMethod"])}>
                            <option value="MOBILE_MONEY">{t("billing.mobileMoney")}</option>
                            <option value="BANK_TRANSFER">{t("billing.bankTransfer")}</option>
                        </Select>
                    </Field>

                    <Field label={t("billing.status")}>
                        <Input value={t(`billing.statuses.${form.status ?? "PENDING"}`)} readOnly />
                    </Field>

                    <Field label={t("billing.accountHolderName")} required>
                        <Input value={form.accountHolderName} onChange={(event) => update("accountHolderName", event.target.value)} />
                    </Field>

                    <Field label={t("billing.country")}>
                        <Input value={form.country} onChange={(event) => update("country", event.target.value.toUpperCase())} placeholder="CD" />
                    </Field>

                    <Field label={t("billing.currency")}>
                        <Input value={form.currency} onChange={(event) => update("currency", event.target.value.toUpperCase())} placeholder="USD" />
                    </Field>

                    {form.preferredMethod === "MOBILE_MONEY" ? (
                        <>
                            <Field label={t("billing.mobileProvider")} required>
                                <Select value={form.mobileProvider} onChange={(event) => update("mobileProvider", event.target.value)}>
                                    <option value="MAXICASH">Maxicash</option>
                                    <option value="MPESA">M-Pesa</option>
                                    <option value="AIRTEL_MONEY">Airtel Money</option>
                                    <option value="ORANGE_MONEY">Orange Money</option>
                                </Select>
                            </Field>

                            <Field label={t("billing.mobileNumber")} required>
                                <Input value={form.mobileNumber} onChange={(event) => update("mobileNumber", event.target.value)} placeholder="+243810000000" />
                            </Field>
                        </>
                    ) : (
                        <>
                            <Field label={t("billing.bankName")} required>
                                <Input value={form.bankName} onChange={(event) => update("bankName", event.target.value)} />
                            </Field>

                            <Field label={t("billing.bankAccountNumber")} required>
                                <Input value={form.bankAccountNumber} onChange={(event) => update("bankAccountNumber", event.target.value)} />
                            </Field>

                            <Field label={t("billing.bankRoutingNumber")}>
                                <Input value={form.bankRoutingNumber} onChange={(event) => update("bankRoutingNumber", event.target.value)} />
                            </Field>

                            <Field label={t("billing.bankSwiftCode")}>
                                <Input value={form.bankSwiftCode} onChange={(event) => update("bankSwiftCode", event.target.value)} />
                            </Field>

                            <Field label={t("billing.bankIban")}>
                                <Input value={form.bankIban} onChange={(event) => update("bankIban", event.target.value)} />
                            </Field>
                        </>
                    )}
                </div>

                <div className="bg-blue-50 rounded p-4">
                    <p className="text-sm text-blue-800">
                        {t("billing.securityNotice")}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={save}
                    disabled={saving || loading}
                    className="inline-flex items-center gap-2 rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Save className="size-4" />
                    {saving ? t("billing.saving") : t("billing.savePayout")}
                </button>
            </div>
        </div>
    );
}

function normalizePayoutAccount(data: any): Partial<PayoutAccountForm> {
    return {
        preferredMethod: data?.preferredMethod ?? "MOBILE_MONEY",
        accountHolderName: data?.accountHolderName ?? "",
        bankName: data?.bankName ?? "",
        bankAccountNumber: data?.bankAccountNumber ?? "",
        bankRoutingNumber: data?.bankRoutingNumber ?? "",
        bankSwiftCode: data?.bankSwiftCode ?? "",
        bankIban: data?.bankIban ?? "",
        mobileProvider: data?.mobileProvider ?? "MAXICASH",
        mobileNumber: data?.mobileNumber ?? "",
        country: data?.country ?? "CD",
        currency: data?.currency ?? "USD",
        status: data?.status ?? "PENDING",
    };
}

function cleanPayoutPayload(form: PayoutAccountForm) {
    const payload: Record<string, string> = {
        preferredMethod: form.preferredMethod,
        accountHolderName: form.accountHolderName,
        country: form.country,
        currency: form.currency,
    };

    if (form.preferredMethod === "MOBILE_MONEY") {
        payload.mobileProvider = form.mobileProvider;
        payload.mobileNumber = form.mobileNumber;
    } else {
        payload.bankName = form.bankName;
        payload.bankAccountNumber = form.bankAccountNumber;
        payload.bankRoutingNumber = form.bankRoutingNumber;
        payload.bankSwiftCode = form.bankSwiftCode;
        payload.bankIban = form.bankIban;
    }

    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== ""));
}

// ==================== Tax Section ====================
function TaxSection({ t }: { t: any }) {
    return (
        <div>
            <SectionHeader
                icon={<ShieldCheck className="size-5" />}
                title={t("tax.title")}
                description={t("tax.description")}
            />

            <div className="mb-8 overflow-hidden rounded border border-slate-200">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-5 py-3 font-semibold text-slate-600">{t("tax.country")}</th>
                        <th className="px-5 py-3 font-semibold text-slate-600">{t("tax.collecting")}</th>
                        <th className="px-5 py-3 font-semibold text-slate-600">{t("tax.percentage")}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr className="border-b border-slate-100">
                        <td className="px-5 py-4 font-medium">United States</td>
                        <td className="px-5 py-4">Sales Tax</td>
                        <td className="px-5 py-4">10%</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                        <td className="px-5 py-4 font-medium">DR Congo</td>
                        <td className="px-5 py-4">VAT</td>
                        <td className="px-5 py-4">16%</td>
                    </tr>
                    <tr>
                        <td className="px-5 py-4 font-medium">European Union</td>
                        <td className="px-5 py-4">VAT</td>
                        <td className="px-5 py-4">20%</td>
                    </tr>
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label={t("tax.fullName")} required>
                    <Input defaultValue="Robert Johnson" />
                </Field>

                <Field label={t("tax.countryTreaty")} required>
                    <Select defaultValue="cd">
                        <option value="us">United States</option>
                        <option value="cd">DR Congo</option>
                        <option value="fr">France</option>
                    </Select>
                </Field>

                <Field label={t("tax.residence")} required>
                    <Input defaultValue="Kinshasa, DR Congo" />
                </Field>

                <Field label={t("tax.taxId")}>
                    <Input placeholder="Enter your tax ID (optional)" />
                </Field>
            </div>
        </div>
    );
}

// ==================== Link Account Section ====================
function LinkAccountSection({ t }: { t: any }) {
    return (
        <div>
            <SectionHeader
                icon={<LinkIcon className="size-5" />}
                title={t("link.title")}
                description={t("link.description")}
            />

            <div className="space-y-4">
                <Field label="Instagram">
                    <Input defaultValue="https://www.instagram.com/kongoevent" />
                </Field>

                <Field label="Facebook">
                    <Input defaultValue="https://www.facebook.com/kongoevent" />
                </Field>

                <Field label="Twitter/X">
                    <Input defaultValue="https://www.twitter.com/kongoevent" />
                </Field>

                <Field label="YouTube">
                    <Input defaultValue="https://www.youtube.com/kongoevent" />
                </Field>

                <Field label="LinkedIn">
                    <Input placeholder="https://www.linkedin.com/company/kongoevent" />
                </Field>

                <Field label="TikTok">
                    <Input placeholder="https://www.tiktok.com/@kongoevent" />
                </Field>
            </div>
        </div>
    );
}

// ==================== Language Section ====================
function LanguageSection({ t }: { t: any }) {
    return (
        <div>
            <SectionHeader
                icon={<Globe2 className="size-5" />}
                title={t("language.title")}
                description={t("language.description")}
            />

            <div className="space-y-8">
                <div>
                    <h3 className="text-base font-extrabold text-slate-900 mb-4">{t("language.timeTitle")}</h3>
                    <Field label={t("language.timeZone")}>
                        <Select defaultValue="cat">
                            <option value="pst">Pacific Standard Time (PST)</option>
                            <option value="est">Eastern Standard Time (EST)</option>
                            <option value="cat">Central Africa Time (CAT)</option>
                            <option value="utc">Coordinated Universal Time (UTC)</option>
                        </Select>
                    </Field>
                </div>

                <div>
                    <h3 className="text-base font-extrabold text-slate-900 mb-4">{t("language.languageTitle")}</h3>
                    <Field label={t("language.language")}>
                        <Select defaultValue="en">
                            <option value="en">English (United States)</option>
                            <option value="fr">Français</option>
                            <option value="ln">Lingala</option>
                            <option value="sw">Swahili</option>
                        </Select>
                    </Field>
                </div>

                <div>
                    <h3 className="text-base font-extrabold text-slate-900 mb-4">Date Format</h3>
                    <Field label="Preferred date format">
                        <Select defaultValue="mm/dd/yyyy">
                            <option value="mm/dd/yyyy">MM/DD/YYYY (US)</option>
                            <option value="dd/mm/yyyy">DD/MM/YYYY (EU)</option>
                            <option value="yyyy-mm-dd">YYYY-MM-DD (ISO)</option>
                        </Select>
                    </Field>
                </div>
            </div>
        </div>
    );
}

// ==================== Password Section ====================
function PasswordSection({ t }: { t: any }) {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <div>
            <SectionHeader
                icon={<LockKeyhole className="size-5" />}
                title={t("password.title")}
                description={t("password.description")}
            />

            <div className="space-y-6 max-w-lg">
                <Field label={t("password.currentPassword")} required>
                    <PasswordInput
                        value="12345678"
                        show={showCurrentPassword}
                        onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                    />
                </Field>

                <Field label={t("password.newPassword")} required helpText={t("password.hint")}>
                    <PasswordInput
                        show={showNewPassword}
                        onToggle={() => setShowNewPassword(!showNewPassword)}
                    />
                </Field>

                <Field label={t("password.confirmPassword")} required>
                    <PasswordInput
                        show={showConfirmPassword}
                        onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                </Field>

                <div className="bg-amber-50 rounded p-4 border border-amber-200">
                    <p className="text-sm text-amber-800">
                        🔒 Password requirements: Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character.
                    </p>
                </div>
            </div>
        </div>
    );
}

function PasswordInput({ show, onToggle, value }: { show: boolean; onToggle: () => void; value?: string }) {
    return (
        <div className="relative">
            <input
                type={show ? "text" : "password"}
                defaultValue={value}
                placeholder="Enter password"
                className="h-11 w-full rounded border border-slate-200 bg-white px-4 pr-12 text-sm font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
        </div>
    );
}

// ==================== Notifications Section ====================
function NotificationsSection({ t }: { t: any }) {
    const [notifications, setNotifications] = useState({
        transactionConfirmation: true,
        transactionEdited: false,
        transactionInvoice: true,
        transactionCancelled: true,
        transactionRefund: true,
        paymentError: true,
        marketingEmails: false,
        weeklyDigest: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        api.get("/settings/me/notification-preferences")
            .then((response) => {
                if (!mounted) return;
                setNotifications((current) => ({ ...current, ...normalizeNotificationPreferences(response.data) }));
            })
            .catch(() => {
                if (mounted) setError(t("notifications.loadError"));
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [t]);

    const toggleNotification = (key: keyof typeof notifications) => {
        setMessage("");
        setError("");
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const save = async () => {
        setSaving(true);
        setMessage("");
        setError("");
        try {
            const response = await api.patch("/settings/me/notification-preferences", notifications);
            setNotifications((current) => ({ ...current, ...normalizeNotificationPreferences(response.data) }));
            setMessage(t("notifications.saveSuccess"));
        } catch {
            setError(t("notifications.saveError"));
        } finally {
            setSaving(false);
        }
    };

    const notificationItems = [
        { key: "transactionConfirmation", title: t("notifications.items.transactionConfirmation.title"), description: t("notifications.items.transactionConfirmation.description") },
        { key: "transactionEdited", title: t("notifications.items.transactionEdited.title"), description: t("notifications.items.transactionEdited.description") },
        { key: "transactionInvoice", title: t("notifications.items.transactionInvoice.title"), description: t("notifications.items.transactionInvoice.description") },
        { key: "transactionCancelled", title: t("notifications.items.transactionCancelled.title"), description: t("notifications.items.transactionCancelled.description") },
        { key: "transactionRefund", title: t("notifications.items.transactionRefund.title"), description: t("notifications.items.transactionRefund.description") },
        { key: "paymentError", title: t("notifications.items.paymentError.title"), description: t("notifications.items.paymentError.description") },
    ];

    return (
        <div>
            <SectionHeader
                icon={<Bell className="size-5" />}
                title={t("notifications.title")}
                description={t("notifications.description")}
            />

            <div className="space-y-6">
                {loading && (
                    <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                        {t("notifications.loading")}
                    </div>
                )}
                {message && (
                    <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="rounded border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                        {error}
                    </div>
                )}

                {notificationItems.map((item) => (
                    <div
                        key={item.key}
                        className="flex items-start justify-between gap-5 py-4 border-b border-slate-100 last:border-0"
                    >
                        <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{item.title}</h3>
                            <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                        </div>

                        <Toggle
                            enabled={notifications[item.key as keyof typeof notifications]}
                            onChange={() => toggleNotification(item.key as keyof typeof notifications)}
                        />
                    </div>
                ))}

                <div className="pt-4">
                    <h3 className="font-semibold text-slate-900 mb-4">{t("notifications.emailPreferences")}</h3>

                    <div className="space-y-4">
                        <div className="flex items-start justify-between gap-5">
                            <div>
                                <h4 className="font-medium text-slate-800">{t("notifications.items.marketingEmails.title")}</h4>
                                <p className="text-sm text-slate-500">{t("notifications.items.marketingEmails.description")}</p>
                            </div>
                            <Toggle enabled={notifications.marketingEmails} onChange={() => toggleNotification("marketingEmails")} />
                        </div>

                        <div className="flex items-start justify-between gap-5">
                            <div>
                                <h4 className="font-medium text-slate-800">{t("notifications.items.weeklyDigest.title")}</h4>
                                <p className="text-sm text-slate-500">{t("notifications.items.weeklyDigest.description")}</p>
                            </div>
                            <Toggle enabled={notifications.weeklyDigest} onChange={() => toggleNotification("weeklyDigest")} />
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={save}
                    disabled={loading || saving}
                    className="inline-flex items-center gap-2 rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Save className="size-4" />
                    {saving ? t("notifications.saving") : t("notifications.save")}
                </button>
            </div>
        </div>
    );
}

function normalizeNotificationPreferences(data: any) {
    return {
        transactionConfirmation: Boolean(data?.transactionConfirmation ?? true),
        transactionEdited: Boolean(data?.transactionEdited ?? false),
        transactionInvoice: Boolean(data?.transactionInvoice ?? true),
        transactionCancelled: Boolean(data?.transactionCancelled ?? true),
        transactionRefund: Boolean(data?.transactionRefund ?? true),
        paymentError: Boolean(data?.paymentError ?? true),
        marketingEmails: Boolean(data?.marketingEmails ?? false),
        weeklyDigest: Boolean(data?.weeklyDigest ?? true),
    };
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
    return (
        <button
            type="button"
            onClick={onChange}
            className={`relative h-6 w-11 rounded transition-all ${
                enabled ? "bg-blue-600" : "bg-slate-200"
            }`}
        >
            <span
                className={`absolute top-[2px] size-5 rounded bg-white shadow-sm transition-all ${
                    enabled ? "right-[2px]" : "left-[2px]"
                }`}
            />
        </button>
    );
}
