"use client";

import { useState } from "react";
import {
    CircleDollarSign,
    CreditCard,
    Download,
    Info,
    ListFilter,
    Search,
    SortAsc,
    TrendingUp,
    Wallet,
    X,
    AlertCircle,
    CheckCircle,
    Clock,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSidebar } from "@/contexts/SidebarContext";
import { formatCurrency, formatNumber } from "@/shared/lib/formatNumber";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

// Mock Data
const EARNINGS = [
    { id: "1", eventName: "Imagination Expo 2025", ticketsSold: 582, revenue: 39800, platformFee: 100, netEarnings: 39700, status: "paid", date: "Mar 15, 2024" },
    { id: "2", eventName: "Dreamers' Festival 2025", ticketsSold: 804, revenue: 50000, platformFee: 100, netEarnings: 49900, status: "paid", date: "Apr 20, 2024" },
    { id: "3", eventName: "Creative Convergence 2025", ticketsSold: 148, revenue: 34900, platformFee: 100, netEarnings: 34800, status: "paid", date: "May 10, 2024" },
    { id: "4", eventName: "Artistic Odyssey 2025", ticketsSold: 295, revenue: 63120, platformFee: 100, netEarnings: 63020, status: "paid", date: "Jun 5, 2024" },
    { id: "5", eventName: "Spectrum Showcase 2025", ticketsSold: 914, revenue: 45600, platformFee: 100, netEarnings: 45500, status: "available", date: "Jul 12, 2024" },
    { id: "6", eventName: "Cultural Fusion Fest 2025", ticketsSold: 376, revenue: 32750, platformFee: 100, netEarnings: 32650, status: "available", date: "Aug 18, 2024" },
    { id: "7", eventName: "Innovators' Gala 2025", ticketsSold: 237, revenue: 58900, platformFee: 100, netEarnings: 58800, status: "pending", date: "Sep 22, 2024" },
    { id: "8", eventName: "Visionary Vibes 2025", ticketsSold: 519, revenue: 41300, platformFee: 100, netEarnings: 41200, status: "pending", date: "Oct 30, 2024" },
    { id: "9", eventName: "Elysium Arts Festival 2025", ticketsSold: 763, revenue: 27450, platformFee: 100, netEarnings: 27350, status: "pending", date: "Nov 14, 2024" },
];

export default function EarningsPage() {
    const t = useTranslations("earnings");
    const locale = useLocale();
    const { isCollapsed } = useSidebar();

    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<"eventName" | "revenue" | "date">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Filter earnings
    const filteredEarnings = EARNINGS.filter(earning => {
        const matchesSearch = earning.eventName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || earning.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Sort earnings
    const sortedEarnings = [...filteredEarnings].sort((a, b) => {
        if (sortBy === "eventName") {
            return sortOrder === "asc" ? a.eventName.localeCompare(b.eventName) : b.eventName.localeCompare(a.eventName);
        } else if (sortBy === "revenue") {
            return sortOrder === "asc" ? a.revenue - b.revenue : b.revenue - a.revenue;
        } else {
            return sortOrder === "asc"
                ? new Date(a.date).getTime() - new Date(b.date).getTime()
                : new Date(b.date).getTime() - new Date(a.date).getTime();
        }
    });

    // Statistics
    const totalRevenue = EARNINGS.reduce((sum, e) => sum + e.revenue, 0);
    const totalPayouts = EARNINGS.filter(e => e.status === "paid").reduce((sum, e) => sum + e.netEarnings, 0);
    const pendingPayouts = EARNINGS.filter(e => e.status === "pending").reduce((sum, e) => sum + e.netEarnings, 0);
    const availableBalance = EARNINGS.filter(e => e.status === "available").reduce((sum, e) => sum + e.netEarnings, 0);

    const paidCount = EARNINGS.filter(e => e.status === "paid").length;
    const pendingCount = EARNINGS.filter(e => e.status === "pending").length;
    const availableCount = EARNINGS.filter(e => e.status === "available").length;

    const toggleRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedRows.length === sortedEarnings.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(sortedEarnings.map(e => e.id));
        }
    };

    const getStatusColor = (status: string) => {
        const colors = {
            paid: "bg-emerald-50 text-emerald-600 border-emerald-200",
            available: "bg-violet-50 text-violet-600 border-violet-200",
            pending: "bg-amber-50 text-amber-600 border-amber-200",
        };
        return colors[status as keyof typeof colors] || colors.pending;
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case "paid":
                return <CheckCircle className="size-3" />;
            case "available":
                return <Wallet className="size-3" />;
            default:
                return <Clock className="size-3" />;
        }
    };

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
                                {t("breadcrumbManagement")} / <span className="text-slate-900 font-medium">{t("title")}</span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                                <Download className="size-4" />
                                Export
                            </button>
                            <button
                                onClick={() => setOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all hover:shadow-md"
                            >
                                <Wallet className="size-4" />
                                {t("requestPayout")}
                            </button>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                        <MetricCard
                            icon={<CircleDollarSign className="size-5" />}
                            title={t("metrics.totalRevenue")}
                            value={`$${(totalRevenue / 1000).toFixed(1)}K`}
                            trend="+12.5%"
                            trendUp={true}
                        />
                        <MetricCard
                            icon={<CreditCard className="size-5" />}
                            title={t("metrics.totalPayouts")}
                            value={`$${(totalPayouts / 1000).toFixed(1)}K`}
                            trend="+8.2%"
                            trendUp={true}
                        />
                        <MetricCard
                            icon={<Clock className="size-5" />}
                            title={t("metrics.pendingPayouts")}
                            value={`$${(pendingPayouts / 1000).toFixed(1)}K`}
                            trend="+5.3%"
                            trendUp={false}
                        />
                        <MetricCard
                            icon={<Wallet className="size-5" />}
                            title={t("metrics.availableBalance")}
                            value={`$${(availableBalance / 1000).toFixed(1)}K`}
                            trend="+15.2%"
                            trendUp={true}
                        />
                    </div>

                    {/* Status Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                        <div className="bg-emerald-50 rounded p-4 border border-emerald-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-emerald-600 mb-1">Paid</p>
                                    <p className="text-2xl font-bold text-emerald-700">{paidCount}</p>
                                </div>
                                <CheckCircle className="size-8 text-emerald-500" />
                            </div>
                        </div>
                        <div className="bg-amber-50 rounded p-4 border border-amber-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-amber-600 mb-1">Pending</p>
                                    <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
                                </div>
                                <Clock className="size-8 text-amber-500" />
                            </div>
                        </div>
                        <div className="bg-violet-50 rounded p-4 border border-violet-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-violet-600 mb-1">Available</p>
                                    <p className="text-2xl font-bold text-violet-700">{availableCount}</p>
                                </div>
                                <Wallet className="size-8 text-violet-500" />
                            </div>
                        </div>
                    </div>

                    {/* Earnings Table */}
                    <div className="bg-white rounded border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                        <div className="p-5 border-b border-slate-100">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <h2 className="text-lg font-bold text-slate-900">
                                    {t("tableTitle")} ({sortedEarnings.length})
                                </h2>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    {/* Search */}
                                    <div className="flex h-10 w-full items-center gap-2 rounded border border-slate-200 px-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 sm:w-64">
                                        <Search className="size-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder={t("search")}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                                        />
                                    </div>

                                    {/* Filter by Status */}
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="h-10 px-3 rounded border border-slate-200 text-sm font-medium text-slate-600 outline-none focus:border-blue-400"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="paid">Paid</option>
                                        <option value="pending">Pending</option>
                                        <option value="available">Available</option>
                                    </select>

                                    {/* Sort Button */}
                                    <button
                                        onClick={() => {
                                            const nextSort: ("eventName" | "revenue" | "date")[] = ["date", "eventName", "revenue"];
                                            const currentIndex = nextSort.indexOf(sortBy);
                                            const nextSortBy = nextSort[(currentIndex + 1) % nextSort.length];
                                            if (nextSortBy === sortBy) {
                                                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                                            } else {
                                                setSortBy(nextSortBy);
                                                setSortOrder("asc");
                                            }
                                        }}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        <SortAsc className="size-4" />
                                        Sort by {sortBy}
                                        {sortOrder === "asc" ? " ↑" : " ↓"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px]">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="w-12 px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.length === sortedEarnings.length && sortedEarnings.length > 0}
                                            onChange={toggleAll}
                                            className="rounded border-slate-300"
                                        />
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.eventName")}</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.ticketsSold")}</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.revenue")}</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.platformFee")}</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.netEarnings")}</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.status")}</th>
                                </tr>
                                </thead>

                                <tbody>
                                {sortedEarnings.map((earning, index) => (
                                    <tr key={earning.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(earning.id)}
                                                onChange={() => toggleRow(earning.id)}
                                                className="rounded border-slate-300"
                                            />
                                        </td>
                                        <td className="px-5 py-4 text-sm font-semibold text-slate-500">{index + 1}</td>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-900">{earning.eventName}</p>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-500">{earning.date}</td>
                                        <td className="px-5 py-4 text-sm text-slate-600">{formatNumber(earning.ticketsSold, locale)}</td>
                                        <td className="px-5 py-4 font-semibold text-slate-900">{formatCurrency(earning.revenue, locale)}</td>
                                        <td className="px-5 py-4 text-sm text-slate-500">{formatCurrency(earning.platformFee, locale)}</td>
                                        <td className="px-5 py-4 font-semibold text-emerald-600">{formatCurrency(earning.netEarnings, locale)}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5">
                                                {getStatusIcon(earning.status)}
                                                <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold border ${getStatusColor(earning.status)}`}>
                            {t(`status.${earning.status}`)}
                          </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>

                            {sortedEarnings.length === 0 && (
                                <div className="text-center py-12">
                                    <CircleDollarSign className="size-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-400">No earnings found</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-slate-500">
                                Showing {sortedEarnings.length} of {EARNINGS.length} earnings
                                {selectedRows.length > 0 && ` (${selectedRows.length} selected)`}
                            </p>

                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 rounded border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                    Previous
                                </button>
                                <button className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                                    1
                                </button>
                                <button className="px-3 py-1.5 rounded border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                    2
                                </button>
                                <button className="px-3 py-1.5 rounded border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Payout Modal */}
            {open && <PayoutModal t={t} onClose={() => setOpen(false)} />}
        </div>
    );
}

// ==================== Metric Card Component ====================
function MetricCard({
                        icon,
                        title,
                        value,
                        trend,
                        trendUp
                    }: {
    icon: React.ReactNode;
    title: string;
    value: string;
    trend: string;
    trendUp: boolean;
}) {
    return (
        <div className="bg-white rounded border border-slate-200 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded bg-blue-50 text-blue-600">
                    {icon}
                </div>
                <Info className="size-4 text-slate-300 cursor-pointer hover:text-slate-400 transition-colors" />
            </div>

            <p className="text-sm text-slate-500 mb-1">{title}</p>

            <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                    trendUp
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600"
                }`}>
          <TrendingUp className={`size-3 ${!trendUp && "rotate-180"}`} />
                    {trend}
        </span>
            </div>
        </div>
    );
}

// ==================== Payout Modal ====================
function PayoutModal({ t, onClose }: { t: any; onClose: () => void }) {
    const [formData, setFormData] = useState({
        amount: "4000.00",
        paymentMethod: "paypal",
        details: "johndoe@example.com",
        note: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle payout request
        console.log("Payout request:", formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 p-4">
            <div className="h-full w-full max-w-md overflow-y-auto rounded bg-white shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-extrabold text-slate-950">{t("modal.title")}</h2>
                    <button
                        onClick={onClose}
                        className="flex size-9 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <Field label={t("modal.amount")} required>
                            <Input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                placeholder="Enter amount"
                            />
                        </Field>

                        <Field label={t("modal.paymentMethod")} required>
                            <select
                                value={formData.paymentMethod}
                                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                                className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="paypal">PayPal</option>
                                <option value="bank">Bank Transfer</option>
                                <option value="mobile">Mobile Money</option>
                            </select>
                        </Field>

                        <Field label={t("modal.details")} required>
                            <Input
                                value={formData.details}
                                onChange={(e) => setFormData({...formData, details: e.target.value})}
                                placeholder="Email, account number or phone number"
                            />
                        </Field>

                        <Field label={t("modal.note")}>
              <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className="min-h-24 w-full resize-none rounded border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Optional note"
              />
                        </Field>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-11 rounded border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            {t("cancel")}
                        </button>
                        <button
                            type="submit"
                            className="h-11 rounded bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                            {t("submit")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ==================== Form Components ====================
function Field({
                   label,
                   required,
                   children,
               }: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-slate-300"
        />
    );
}
