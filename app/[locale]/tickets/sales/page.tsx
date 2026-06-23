"use client";

import {
    CalendarCheck,
    CircleDollarSign,
    Download,
    Info,
    ListFilter,
    Search,
    SortAsc,
    Ticket,
    TrendingUp,
    UserCheck,
    UserX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useSidebar } from "@/contexts/SidebarContext";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

// Mock Data
const ATTENDEES = [
    { id: "1", name: "Liam Smith", email: "liamsmith@gmail.com", ticketType: "VIP", purchaseDate: "June 15, 2025", status: "Checked In", amount: 150 },
    { id: "2", name: "Sophia Johnson", email: "sophiajohnson@gmail.com", ticketType: "VIP", purchaseDate: "May 30, 2025", status: "Checked In", amount: 150 },
    { id: "3", name: "Olivia Brown", email: "oliviabrown@gmail.com", ticketType: "VIP", purchaseDate: "July 4, 2025", status: "Checked In", amount: 150 },
    { id: "4", name: "Noah Davis", email: "noahdavis@gmail.com", ticketType: "General", purchaseDate: "May 1, 2025", status: "Checked In", amount: 75 },
    { id: "5", name: "Mia Thomas", email: "miathomas@gmail.com", ticketType: "General", purchaseDate: "May 18, 2025", status: "Checked In", amount: 75 },
    { id: "6", name: "Emma Wilson", email: "emmawilson@gmail.com", ticketType: "VIP", purchaseDate: "April 22, 2025", status: "Checked In", amount: 150 },
    { id: "7", name: "Aiden Taylor", email: "aidentaylor@gmail.com", ticketType: "General", purchaseDate: "May 25, 2025", status: "Not Checked In", amount: 75 },
    { id: "8", name: "Isabella Martinez", email: "isabellamartinez@gmail.com", ticketType: "VIP", purchaseDate: "May 12, 2025", status: "Not Checked In", amount: 150 },
    { id: "9", name: "Lucas Anderson", email: "lucasanderson@gmail.com", ticketType: "General", purchaseDate: "May 29, 2025", status: "Not Checked In", amount: 75 },
    { id: "10", name: "Ella Garcia", email: "ellagarcia@gmail.com", ticketType: "VIP", purchaseDate: "June 1, 2025", status: "Checked In", amount: 150 },
    { id: "11", name: "Mason Rodriguez", email: "masonr@gmail.com", ticketType: "General", purchaseDate: "May 28, 2025", status: "Not Checked In", amount: 75 },
    { id: "12", name: "Amelia Martinez", email: "ameliam@gmail.com", ticketType: "VIP", purchaseDate: "June 10, 2025", status: "Checked In", amount: 150 },
];

export default function TicketSalesPage() {
    const t = useTranslations("tickets");
    const { isCollapsed } = useSidebar();

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterTicketType, setFilterTicketType] = useState("all");
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<"name" | "date" | "status">("date");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Filter attendees
    const filteredAttendees = ATTENDEES.filter(attendee => {
        const matchesSearch = attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            attendee.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || attendee.status.toLowerCase() === filterStatus.toLowerCase();
        const matchesTicketType = filterTicketType === "all" || attendee.ticketType.toLowerCase() === filterTicketType.toLowerCase();
        return matchesSearch && matchesStatus && matchesTicketType;
    });

    // Sort attendees
    const sortedAttendees = [...filteredAttendees].sort((a, b) => {
        if (sortBy === "name") {
            return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        } else if (sortBy === "date") {
            return sortOrder === "asc"
                ? new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
                : new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        } else {
            return sortOrder === "asc"
                ? a.status.localeCompare(b.status)
                : b.status.localeCompare(a.status);
        }
    });

    // Statistics
    const totalTickets = ATTENDEES.length;
    const totalRevenue = ATTENDEES.reduce((sum, a) => sum + a.amount, 0);
    const checkedIn = ATTENDEES.filter(a => a.status === "Checked In").length;
    const notCheckedIn = ATTENDEES.filter(a => a.status === "Not Checked In").length;
    const vipTickets = ATTENDEES.filter(a => a.ticketType === "VIP").length;
    const generalTickets = ATTENDEES.filter(a => a.ticketType === "General").length;
    const checkinRate = ((checkedIn / totalTickets) * 100).toFixed(1);

    const toggleRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedRows.length === sortedAttendees.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(sortedAttendees.map(a => a.id));
        }
    };

    const getStatusColor = (status: string) => {
        return status === "Checked In"
            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
            : "bg-rose-50 text-rose-600 border-rose-200";
    };

    const getTicketTypeColor = (type: string) => {
        return type === "VIP"
            ? "bg-purple-50 text-purple-600"
            : "bg-slate-50 text-slate-600";
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
                                {t("sales.title")}
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                {t("breadcrumbManagement")} / <span className="text-slate-900 font-medium">{t("breadcrumbTickets")}</span>
                            </p>
                        </div>

                        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all hover:shadow-sm">
                            <Download className="size-4" />
                            {t("exportCsv")}
                        </button>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                        <MetricCard
                            icon={<Ticket className="size-5" />}
                            title={t("metrics.ticketsSold")}
                            value={totalTickets.toLocaleString()}
                            trend="+12.5%"
                            trendUp={true}
                        />
                        <MetricCard
                            icon={<CircleDollarSign className="size-5" />}
                            title={t("metrics.revenueGenerated")}
                            value={`$${totalRevenue.toLocaleString()}`}
                            trend="+8.2%"
                            trendUp={true}
                        />
                        <MetricCard
                            icon={<CalendarCheck className="size-5" />}
                            title={t("metrics.checkinsCompleted")}
                            value={checkedIn.toLocaleString()}
                            trend={`${checkinRate}% rate`}
                            trendUp={true}
                        />
                        <MetricCard
                            icon={<UserCheck className="size-5" />}
                            title={t("metrics.checkinsRemaining")}
                            value={notCheckedIn.toLocaleString()}
                            trend={`${(notCheckedIn / totalTickets * 100).toFixed(1)}%`}
                            trendUp={false}
                        />
                    </div>

                    {/* Additional Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                        <div className="bg-white rounded border border-slate-200 p-5">
                            <h3 className="text-sm font-semibold text-slate-500 mb-3">Ticket Type Distribution</h3>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700">VIP Tickets</span>
                                <span className="text-lg font-bold text-slate-900">{vipTickets}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded h-2 mb-3">
                                <div className="bg-purple-500 h-2 rounded" style={{ width: `${(vipTickets / totalTickets) * 100}%` }} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">General Tickets</span>
                                <span className="text-lg font-bold text-slate-900">{generalTickets}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded h-2">
                                <div className="bg-blue-500 h-2 rounded" style={{ width: `${(generalTickets / totalTickets) * 100}%` }} />
                            </div>
                        </div>

                        <div className="bg-white rounded border border-slate-200 p-5">
                            <h3 className="text-sm font-semibold text-slate-500 mb-3">Check-in Status</h3>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-700">Checked In</span>
                                <span className="text-lg font-bold text-emerald-600">{checkedIn}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded h-2 mb-3">
                                <div className="bg-emerald-500 h-2 rounded" style={{ width: `${(checkedIn / totalTickets) * 100}%` }} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">Not Checked In</span>
                                <span className="text-lg font-bold text-rose-600">{notCheckedIn}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded h-2">
                                <div className="bg-rose-500 h-2 rounded" style={{ width: `${(notCheckedIn / totalTickets) * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Attendees Table */}
                    <div className="bg-white rounded border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                        <div className="p-5 border-b border-slate-100">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <h2 className="text-lg font-bold text-slate-900">{t("sales.tableTitle")}</h2>

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
                                        <option value="checked in">Checked In</option>
                                        <option value="not checked in">Not Checked In</option>
                                    </select>

                                    {/* Filter by Ticket Type */}
                                    <select
                                        value={filterTicketType}
                                        onChange={(e) => setFilterTicketType(e.target.value)}
                                        className="h-10 px-3 rounded border border-slate-200 text-sm font-medium text-slate-600 outline-none focus:border-blue-400"
                                    >
                                        <option value="all">All Ticket Types</option>
                                        <option value="vip">VIP</option>
                                        <option value="general">General</option>
                                    </select>

                                    {/* Sort Button */}
                                    <button
                                        onClick={() => {
                                            const nextSort: ("name" | "date" | "status")[] = ["date", "name", "status"];
                                            const currentIndex = nextSort.indexOf(sortBy);
                                            const nextSortBy = nextSort[(currentIndex + 1) % nextSort.length];
                                            setSortBy(nextSortBy);
                                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                                        }}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        <SortAsc className="size-4" />
                                        Sort by {sortBy}
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
                                            checked={selectedRows.length === sortedAttendees.length && sortedAttendees.length > 0}
                                            onChange={toggleAll}
                                            className="rounded border-slate-300"
                                        />
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.name")}</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.email")}</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.ticketType")}</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.purchaseDate")}</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.checkinStatus")}</th>
                                    <th className="w-12 px-5 py-3"></th>
                                </tr>
                                </thead>

                                <tbody>
                                {sortedAttendees.map((attendee, index) => (
                                    <tr key={attendee.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                        <td className="px-5 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(attendee.id)}
                                                onChange={() => toggleRow(attendee.id)}
                                                className="rounded border-slate-300"
                                            />
                                        </td>
                                        <td className="px-5 py-4 text-sm font-semibold text-slate-500">{index + 1}</td>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-900">{attendee.name}</p>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-500">{attendee.email}</td>
                                        <td className="px-5 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${getTicketTypeColor(attendee.ticketType)}`}>
                                                    {attendee.ticketType}
                                                </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-500">{attendee.purchaseDate}</td>
                                        <td className="px-5 py-4 font-semibold text-slate-700">${attendee.amount}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                {attendee.status === "Checked In" ? (
                                                    <UserCheck className="size-4 text-emerald-500" />
                                                ) : (
                                                    <UserX className="size-4 text-rose-500" />
                                                )}
                                                <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold border ${getStatusColor(attendee.status)}`}>
                                                        {attendee.status === "Checked In" ? t("checkedIn") : t("notCheckedIn")}
                                                    </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-slate-600">
                                            •••
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>

                            {sortedAttendees.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-slate-400">No attendees found</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-slate-500">
                                Showing {sortedAttendees.length} of {ATTENDEES.length} attendees
                                {selectedRows.length > 0 && ` (${selectedRows.length} selected)`}
                            </p>

                            <div className="flex gap-2">
                                <button
                                    className="px-3 py-1.5 rounded border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                    disabled
                                >
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
        </div>
    );
}

// ==================== Metric Card Component ====================
function MetricCard({
                        icon,
                        title,
                        value,
                        trend,
                        trendUp,
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
