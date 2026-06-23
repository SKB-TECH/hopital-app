"use client";

import { CreditCard, Edit, Eye, Search, SortAsc, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Payout, PayoutSortField } from "@/components/payout/types";
import { getPayoutStatusColor } from "@/components/payout/utils/payout-status";
import { useDeletePayment } from "@/shared/hooks/payment.hooks";
import { formatCurrency } from "@/shared/lib/formatNumber";

export type { PayoutSortField };

type PayoutsTableProps = {
    payouts: Payout[];
    totalCount: number;
    page: number;
    pages: number;
    limit: number;
    isLoading?: boolean;
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    filterStatus: string;
    onFilterStatusChange: (value: string) => void;
    sortBy: PayoutSortField;
    sortOrder: "asc" | "desc";
    onSortChange: (field: PayoutSortField, order: "asc" | "desc") => void;
    onPageChange: (page: number) => void;
    onEdit: (payout: Payout) => void;
    onCreate: () => void;
};

export function PayoutsTable({
    payouts,
    totalCount,
    page,
    pages,
    limit,
    isLoading = false,
    searchTerm,
    onSearchTermChange,
    filterStatus,
    onFilterStatusChange,
    sortBy,
    sortOrder,
    onSortChange,
    onPageChange,
    onEdit,
    onCreate,
}: PayoutsTableProps) {
    const t = useTranslations("payoutsAdmin");
    const locale = useLocale();
    const deletePayment = useDeletePayment();
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedRows.length === payouts.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(payouts.map((p) => p.id));
        }
    };

    const handleDelete = async (payout: Payout) => {
        if (!window.confirm(t("table.deleteConfirm", { orderId: payout.orderId }))) return;

        setDeletingId(payout.id);
        try {
            await deletePayment.mutateAsync(payout.id);
            toast.success(t("table.deleteSuccess"));
            setSelectedRows((prev) => prev.filter((id) => id !== payout.id));
        } catch {
            toast.error(t("table.deleteError"));
        } finally {
            setDeletingId(null);
        }
    };

    const rangeFrom = totalCount === 0 ? 0 : (page - 1) * limit + 1;
    const rangeTo = totalCount === 0 ? 0 : Math.min(page * limit, totalCount);

    const pageNumbers = useMemo(() => {
        if (pages <= 1) return pages === 0 ? [] : [1];
        const maxVisible = 5;
        let start = Math.max(1, page - Math.floor(maxVisible / 2));
        const end = Math.min(pages, start + maxVisible - 1);
        start = Math.max(1, end - maxVisible + 1);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, [page, pages]);

    const cycleSort = () => {
        const fields: PayoutSortField[] = ["orderId", "amount", "createdAt", "status"];
        const currentIndex = fields.indexOf(sortBy);
        const nextField = fields[(currentIndex + 1) % fields.length];
        if (nextField === sortBy) {
            onSortChange(sortBy, sortOrder === "asc" ? "desc" : "asc");
        } else {
            onSortChange(nextField, "asc");
        }
    };

    const statusLabel = (status: Payout["status"]) => {
        const labels: Record<Payout["status"], string> = {
            pending: t("pending"),
            completed: t("completed"),
            failed: t("failed"),
            cancelled: t("cancelled"),
            refunded: t("refunded"),
        };
        return labels[status];
    };

    return (
        <div className="rounded border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg">
            <div className="border-b border-slate-100 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="text-lg font-bold text-slate-900">
                        {t("tableTitle")} ({payouts.length})
                    </h2>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="flex h-10 w-full items-center gap-2 rounded border border-slate-200 px-3 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 sm:w-64">
                            <Search className="size-4 text-slate-400" />
                            <input
                                type="search"
                                placeholder={t("search")}
                                value={searchTerm}
                                onChange={(e) => onSearchTermChange(e.target.value)}
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => onFilterStatusChange(e.target.value)}
                            aria-label={t("filter")}
                            className="h-10 rounded border border-slate-200 px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400"
                        >
                            <option value="all">{t("filterAll")}</option>
                            <option value="pending">{t("pending")}</option>
                            <option value="completed">{t("completed")}</option>
                            <option value="failed">{t("failed")}</option>
                            <option value="cancelled">{t("cancelled")}</option>
                        </select>

                        <button
                            type="button"
                            onClick={cycleSort}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded border border-slate-200 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                        >
                            <SortAsc className="size-4" />
                            {t("sortBy")} {sortBy}
                            {sortOrder === "asc" ? " ↑" : " ↓"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                    <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                            <th className="w-12 px-5 py-3">
                                <input
                                    type="checkbox"
                                    checked={
                                        selectedRows.length === payouts.length && payouts.length > 0
                                    }
                                    onChange={toggleAll}
                                    aria-label="Select all"
                                    className="rounded border-slate-300"
                                />
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                #
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {t("table.orderId")}
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {t("table.method")}
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {t("table.amount")}
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {t("table.currency")}
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {t("table.providerRef")}
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {t("table.createdAt")}
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {t("table.status")}
                            </th>
                            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {t("table.actions")}
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {isLoading &&
                            Array.from({ length: 5 }).map((_, index) => (
                                <tr key={`skeleton-${index}`} className="border-b border-slate-100">
                                    <td colSpan={10} className="px-5 py-4">
                                        <div className="h-5 animate-pulse rounded bg-slate-100" />
                                    </td>
                                </tr>
                            ))}
                        {!isLoading &&
                            payouts.map((payout, index) => (
                                <tr
                                    key={payout.id}
                                    className="group border-b border-slate-100 transition-colors hover:bg-slate-50"
                                >
                                    <td className="px-5 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.includes(payout.id)}
                                            onChange={() => toggleRow(payout.id)}
                                            aria-label={`Select ${payout.orderId}`}
                                            className="rounded border-slate-300"
                                        />
                                    </td>
                                    <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                                        {index + 1}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="font-mono text-sm font-bold text-slate-900">
                                            {payout.orderId}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                            {payout.method}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-slate-900">
                                        {formatCurrency(payout.amount, locale)}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-600">
                                        {payout.currency}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-500">
                                        {payout.providerRef || "—"}
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-500">
                                        {payout.createdAt}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex rounded border px-2.5 py-1 text-xs font-semibold ${getPayoutStatusColor(payout.status)}`}
                                        >
                                            {statusLabel(payout.status)}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button
                                                type="button"
                                                className="rounded p-1.5 transition-colors hover:bg-slate-100"
                                                title={t("table.view")}
                                            >
                                                <Eye className="size-4 text-slate-500" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onEdit(payout)}
                                                className="rounded p-1.5 transition-colors hover:bg-sky-50"
                                                title={t("table.edit")}
                                            >
                                                <Edit className="size-4 text-sky-500" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(payout)}
                                                disabled={deletingId === payout.id}
                                                className="rounded p-1.5 transition-colors hover:bg-rose-50 disabled:opacity-50"
                                                title={t("table.delete")}
                                            >
                                                <Trash2 className="size-4 text-rose-500" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>

                {!isLoading && payouts.length === 0 && (
                    <div className="py-12 text-center">
                        <CreditCard className="mx-auto mb-3 size-12 text-slate-300" />
                        <p className="text-slate-400">{t("emptyPayouts")}</p>
                        <button
                            type="button"
                            onClick={onCreate}
                            className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                            {t("createFirst")}
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 sm:flex-row">
                <p className="text-sm text-slate-500">
                    {t("tableFooter.showingRange", {
                        from: rangeFrom,
                        to: rangeTo,
                        total: totalCount,
                    })}
                    {selectedRows.length > 0 &&
                        ` ${t("tableFooter.selected", { count: selectedRows.length })}`}
                </p>

                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={page <= 1 || isLoading}
                        onClick={() => onPageChange(page - 1)}
                        className="rounded border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                        {t("pagination.previous")}
                    </button>
                    {pageNumbers.map((pageNumber) => (
                        <button
                            key={pageNumber}
                            type="button"
                            disabled={isLoading}
                            onClick={() => onPageChange(pageNumber)}
                            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                                pageNumber === page
                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            {pageNumber}
                        </button>
                    ))}
                    <button
                        type="button"
                        disabled={page >= pages || pages === 0 || isLoading}
                        onClick={() => onPageChange(page + 1)}
                        className="rounded border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                        {t("pagination.next")}
                    </button>
                </div>
            </div>
        </div>
    );
}
