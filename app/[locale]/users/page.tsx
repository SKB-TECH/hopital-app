"use client";

import { useState } from "react";
import {
    Download,
    Eye,
    ListFilter,
    Pencil,
    Plus,
    Search,
    SortAsc,
    Trash2,
    X,
    UserCheck,
    UserX,
    AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSidebar } from "@/contexts/SidebarContext";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

// Mock Data
const USERS = [
    { id: "1", name: "Sophia Turner", email: "sophiaturner@example.com", phone: "(555) 123-4567", role: "Admin", status: "Active", joinDate: "Jan 15, 2024" },
    { id: "2", name: "Liam Johnson", email: "liamjohnson87@example.com", phone: "(555) 432-1098", role: "Admin", status: "Active", joinDate: "Feb 20, 2024" },
    { id: "3", name: "Olivia Smith", email: "oliviasmith12@example.com", phone: "(555) 876-5432", role: "Admin", status: "Active", joinDate: "Mar 10, 2024" },
    { id: "4", name: "Noah Brown", email: "noahbrown576@example.com", phone: "(555) 456-7890", role: "Organizer", status: "Active", joinDate: "Apr 5, 2024" },
    { id: "5", name: "Emma Davis", email: "emmadavis25@example.com", phone: "(555) 234-5678", role: "Organizer", status: "Active", joinDate: "May 12, 2024" },
    { id: "6", name: "Aiden Wilson", email: "aidenwilson66@example.com", phone: "(555) 567-8901", role: "Organizer", status: "Active", joinDate: "Jun 18, 2024" },
    { id: "7", name: "Isabella Martinez", email: "isabellamartinez@example.com", phone: "(555) 765-4321", role: "Organizer", status: "Active", joinDate: "Jul 22, 2024" },
    { id: "8", name: "Lucas Garcia", email: "lucasgarcia99@example.com", phone: "(555) 345-6789", role: "Organizer", status: "Pending", joinDate: "Aug 30, 2024" },
    { id: "9", name: "Mia Rodrigues", email: "miarodrigues123@example.com", phone: "(555) 987-6543", role: "Attendee", status: "Banned", joinDate: "Sep 14, 2024" },
    { id: "10", name: "Ethan Lee", email: "ethanlee3435@example.com", phone: "(555) 654-3210", role: "Attendee", status: "Banned", joinDate: "Oct 25, 2024" },
];

export default function UsersPage() {
    const t = useTranslations("usersAdmin");
    const { isCollapsed } = useSidebar();

    const [updateOpen, setUpdateOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<"name" | "role" | "status">("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    // Filter users
    const filteredUsers = USERS.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone.includes(searchTerm);
        const matchesRole = filterRole === "all" || user.role.toLowerCase() === filterRole.toLowerCase();
        const matchesStatus = filterStatus === "all" || user.status.toLowerCase() === filterStatus.toLowerCase();
        return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort users
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (sortBy === "name") {
            return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        } else if (sortBy === "role") {
            return sortOrder === "asc" ? a.role.localeCompare(b.role) : b.role.localeCompare(a.role);
        } else {
            return sortOrder === "asc" ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
        }
    });

    // Statistics
    const totalUsers = USERS.length;
    const activeUsers = USERS.filter(u => u.status === "Active").length;
    const pendingUsers = USERS.filter(u => u.status === "Pending").length;
    const bannedUsers = USERS.filter(u => u.status === "Banned").length;
    const adminUsers = USERS.filter(u => u.role === "Admin").length;
    const organizerUsers = USERS.filter(u => u.role === "Organizer").length;
    const attendeeUsers = USERS.filter(u => u.role === "Attendee").length;

    const toggleRow = (id: string) => {
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedRows.length === sortedUsers.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(sortedUsers.map(u => u.id));
        }
    };

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setUpdateOpen(true);
    };

    const getRoleColor = (role: string) => {
        const colors = {
            Admin: "bg-purple-50 text-purple-600 border-purple-200",
            Organizer: "bg-blue-50 text-blue-600 border-blue-200",
            Attendee: "bg-green-50 text-green-600 border-green-200",
        };
        return colors[role as keyof typeof colors] || colors.Attendee;
    };

    const getStatusColor = (status: string) => {
        const colors = {
            Active: "bg-emerald-50 text-emerald-600 border-emerald-200",
            Pending: "bg-amber-50 text-amber-600 border-amber-200",
            Banned: "bg-rose-50 text-rose-600 border-rose-200",
        };
        return colors[status as keyof typeof colors] || colors.Pending;
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case "Active":
                return <UserCheck className="size-3" />;
            case "Banned":
                return <UserX className="size-3" />;
            default:
                return <AlertCircle className="size-3" />;
        }
    };

    const roleLabel = (role: string) => {
        const key = role.toLowerCase() as "admin" | "organizer" | "attendee";
        return t(`roles.${key}`);
    };

    const statusLabel = (status: string) => {
        const key = status.toLowerCase() as "active" | "pending" | "banned";
        return t(`statuses.${key}`);
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
                                {t("breadcrumbManagement")} / <span className="text-slate-900 font-medium">{t("breadcrumbUsers")}</span>
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all">
                                <Download className="size-4" />
                                {t("exportCsv")}
                            </button>
                            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all hover:shadow-md">
                                <Plus className="size-4" />
                                {t("addUser")}
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                        <StatsCard
                            title={t("metrics.totalUsers")}
                            value={totalUsers}
                            icon={<UserCheck className="size-5" />}
                            color="blue"
                        />
                        <StatsCard
                            title={t("metrics.activeUsers")}
                            value={activeUsers}
                            icon={<UserCheck className="size-5" />}
                            color="emerald"
                        />
                        <StatsCard
                            title={t("metrics.pendingApproval")}
                            value={pendingUsers}
                            icon={<AlertCircle className="size-5" />}
                            color="amber"
                        />
                    </div>

                    {/* Role Distribution */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                        <div className="bg-white rounded border border-slate-200 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-500">{t("roles.admins")}</span>
                                <span className="text-2xl font-bold text-purple-600">{adminUsers}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded h-2">
                                <div className="bg-purple-500 h-2 rounded" style={{ width: `${(adminUsers / totalUsers) * 100}%` }} />
                            </div>
                        </div>
                        <div className="bg-white rounded border border-slate-200 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-500">{t("roles.organizers")}</span>
                                <span className="text-2xl font-bold text-blue-600">{organizerUsers}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded h-2">
                                <div className="bg-blue-500 h-2 rounded" style={{ width: `${(organizerUsers / totalUsers) * 100}%` }} />
                            </div>
                        </div>
                        <div className="bg-white rounded border border-slate-200 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-500">{t("roles.attendees")}</span>
                                <span className="text-2xl font-bold text-green-600">{attendeeUsers}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded h-2">
                                <div className="bg-green-500 h-2 rounded" style={{ width: `${(attendeeUsers / totalUsers) * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white rounded border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                        <div className="p-5 border-b border-slate-100">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <h2 className="text-lg font-bold text-slate-900">
                                    {t("tableTitle")} ({sortedUsers.length})
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

                                    {/* Filter by Role */}
                                    <select
                                        value={filterRole}
                                        onChange={(e) => setFilterRole(e.target.value)}
                                        className="h-10 px-3 rounded border border-slate-200 text-sm font-medium text-slate-600 outline-none focus:border-blue-400"
                                    >
                                        <option value="all">{t("filterAllRoles")}</option>
                                        <option value="admin">{t("roles.admin")}</option>
                                        <option value="organizer">{t("roles.organizer")}</option>
                                        <option value="attendee">{t("roles.attendee")}</option>
                                    </select>

                                    {/* Filter by Status */}
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="h-10 px-3 rounded border border-slate-200 text-sm font-medium text-slate-600 outline-none focus:border-blue-400"
                                    >
                                        <option value="all">{t("filterAllStatus")}</option>
                                        <option value="active">{t("statuses.active")}</option>
                                        <option value="pending">{t("statuses.pending")}</option>
                                        <option value="banned">{t("statuses.banned")}</option>
                                    </select>

                                    {/* Sort Button */}
                                    <button
                                        onClick={() => {
                                            const nextSort: ("name" | "role" | "status")[] = ["name", "role", "status"];
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
                                        {t("sortBy")} {t(`sortFields.${sortBy}`)}
                                        {sortOrder === "asc" ? " ↑" : " ↓"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px]">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="w-12 px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.length === sortedUsers.length && sortedUsers.length > 0}
                                            onChange={toggleAll}
                                            className="rounded border-slate-300"
                                        />
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.name")}</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.email")}</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.phone")}</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.joinDate")}</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.role")}</th>
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.status")}</th>
                                    <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{t("table.actions")}</th>
                                </tr>
                                </thead>

                                <tbody>
                                {sortedUsers.map((user, index) => (
                                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                                        <td className="px-5 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(user.id)}
                                                onChange={() => toggleRow(user.id)}
                                                className="rounded border-slate-300"
                                            />
                                        </td>
                                        <td className="px-5 py-4 text-sm font-semibold text-slate-500">{index + 1}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <p className="font-semibold text-slate-900">{user.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-500">{user.email}</td>
                                        <td className="px-5 py-4 text-sm text-slate-500">{user.phone}</td>
                                        <td className="px-5 py-4 text-sm text-slate-500">{user.joinDate}</td>
                                        <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold border ${getRoleColor(user.role)}`}>
                          {roleLabel(user.role)}
                        </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5">
                                                {getStatusIcon(user.status)}
                                                <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold border ${getStatusColor(user.status)}`}>
                            {statusLabel(user.status)}
                          </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 rounded hover:bg-slate-100 transition-colors" title={t("table.view")}>
                                                    <Eye className="size-4 text-slate-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-1.5 rounded hover:bg-sky-50 transition-colors"
                                                    title={t("table.edit")}
                                                >
                                                    <Pencil className="size-4 text-sky-500" />
                                                </button>
                                                <button className="p-1.5 rounded hover:bg-rose-50 transition-colors" title={t("table.delete")}>
                                                    <Trash2 className="size-4 text-rose-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>

                            {sortedUsers.length === 0 && (
                                <div className="text-center py-12">
                                    <UserX className="size-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-400">{t("emptyUsers")}</p>
                                    <button className="mt-3 text-blue-600 text-sm font-semibold hover:text-blue-700">
                                        {t("createFirst")}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-slate-500">
                                {t("tableFooter.showing", { count: sortedUsers.length, total: USERS.length })}
                                {selectedRows.length > 0 &&
                                    ` ${t("tableFooter.selected", { count: selectedRows.length })}`}
                            </p>

                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 rounded border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                    {t("pagination.previous")}
                                </button>
                                <button className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                                    1
                                </button>
                                <button className="px-3 py-1.5 rounded border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                    2
                                </button>
                                <button className="px-3 py-1.5 rounded border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                    3
                                </button>
                                <button className="px-3 py-1.5 rounded border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                    {t("pagination.next")}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Update User Modal */}
            {updateOpen && selectedUser && (
                <UpdateUserModal t={t} user={selectedUser} onClose={() => {
                    setUpdateOpen(false);
                    setSelectedUser(null);
                }} />
            )}
        </div>
    );
}

// ==================== Stats Card Component ====================
function StatsCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
    };

    return (
        <div className="bg-white rounded border border-slate-200 p-5 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded ${colors[color as keyof typeof colors]}`}>
                    {icon}
                </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
    );
}

// ==================== Update User Modal ====================
function UpdateUserModal({ t, user, onClose }: { t: any; user: any; onClose: () => void }) {
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log("Update user:", formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 p-4">
            <div className="h-full w-full max-w-md overflow-y-auto rounded bg-white shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-extrabold text-slate-950">
                        {t("update.title")}
                    </h2>
                    <button
                        onClick={onClose}
                        className="flex size-9 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <Field label={t("form.name")} required>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </Field>

                        <Field label={t("form.email")} required>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </Field>

                        <Field label={t("form.phone")} required>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </Field>

                        <Field label={t("form.role")} required>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                                className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="Admin">{t("roles.admin")}</option>
                                <option value="Organizer">{t("roles.organizer")}</option>
                                <option value="Attendee">{t("roles.attendee")}</option>
                            </select>
                        </Field>

                        <Field label={t("form.status")} required>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                                className="h-11 w-full rounded border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="Active">{t("statuses.active")}</option>
                                <option value="Pending">{t("statuses.pending")}</option>
                                <option value="Banned">{t("statuses.banned")}</option>
                            </select>
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
                            {t("update.submit")}
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
