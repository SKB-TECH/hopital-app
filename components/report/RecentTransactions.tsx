"use client";

import { Search, SortAsc } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { ReportTransaction } from "@/components/report/types";
import { getTransactionStatusColor } from "@/components/report/utils/transaction-status";
import { formatCurrency } from "@/shared/lib/formatNumber";

type RecentTransactionsProps = {
    transactions: ReportTransaction[];
    totalCount: number;
    isLoading?: boolean;
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    filterStatus: string;
    onFilterStatusChange: (value: string) => void;
};

export function RecentTransactions({
    transactions,
    totalCount,
    isLoading = false,
    searchTerm,
    onSearchTermChange,
    filterStatus,
    onFilterStatusChange,
}: RecentTransactionsProps) {
    const t = useTranslations("reports");
    const locale = useLocale();
    const [selectedRows, setSelectedRows] = useState<string[]>([]);

    const toggleRow = (id: string) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedRows.length === transactions.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(transactions.map((tx) => tx.id));
        }
    };

    return (
        <div className="rounded border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg">
            <div className="border-b border-slate-100 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="text-lg font-bold text-slate-900">{t("recentTransactions")}</h2>

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
                            <option value="all">All Status</option>
                            <option value="paid">{t("paid")}</option>
                            <option value="cancelled">{t("cancelled")}</option>
                            <option value="refunded">{t("refunded")}</option>
                        </select>

                        <button
                            type="button"
                            className="inline-flex h-10 items-center justify-center gap-2 rounded border border-slate-200 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                        >
                            <SortAsc className="size-4" />
                            {t("sortBy")}
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                    <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                            <th className="w-12 px-5 py-3">
                                <input
                                    type="checkbox"
                                    checked={
                                        selectedRows.length === transactions.length &&
                                        transactions.length > 0
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
                                {t("table.name")}
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {t("table.email")}
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {t("table.ticketType")}
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {t("table.purchaseDate")}
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {t("table.amount")}
                            </th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {t("table.checkinStatus")}
                            </th>
                            <th className="w-12 px-5 py-3" />
                        </tr>
                    </thead>

                    <tbody>
                        {isLoading &&
                            Array.from({ length: 5 }).map((_, index) => (
                                <tr key={`skeleton-${index}`} className="border-b border-slate-100">
                                    <td colSpan={9} className="px-5 py-4">
                                        <div className="h-5 animate-pulse rounded bg-slate-100" />
                                    </td>
                                </tr>
                            ))}
                        {!isLoading &&
                            transactions.map((transaction, index) => (
                            <tr
                                key={transaction.id}
                                className="group border-b border-slate-100 transition-colors hover:bg-slate-50"
                            >
                                <td className="px-5 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.includes(transaction.id)}
                                        onChange={() => toggleRow(transaction.id)}
                                        aria-label={`Select ${transaction.name}`}
                                        className="rounded border-slate-300"
                                    />
                                </td>
                                <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                                    {index + 1}
                                </td>
                                <td className="px-5 py-4">
                                    <p className="font-semibold text-slate-900">{transaction.name}</p>
                                </td>
                                <td className="px-5 py-4 text-sm text-slate-500">{transaction.email}</td>
                                <td className="px-5 py-4">
                                    <span
                                        className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${
                                            transaction.ticketType === "VIP"
                                                ? "bg-purple-50 text-purple-600"
                                                : "bg-slate-50 text-slate-600"
                                        }`}
                                    >
                                        {transaction.ticketType}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-sm text-slate-500">
                                    {transaction.purchaseDate}
                                </td>
                                <td className="px-5 py-4 font-semibold text-slate-700">
                                    {formatCurrency(transaction.amount, locale)}
                                </td>
                                <td className="px-5 py-4">
                                    <span
                                        className={`inline-flex rounded border px-2.5 py-1 text-xs font-semibold ${getTransactionStatusColor(transaction.status)}`}
                                    >
                                        {transaction.status}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                                    •••
                                </td>
                            </tr>
                            ))}
                    </tbody>
                </table>

                {!isLoading && transactions.length === 0 && (
                    <div className="py-12 text-center">
                        <p className="text-slate-400">{t("emptyTransactions")}</p>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                <p className="text-sm text-slate-500">
                    {t("pagination.showing", {
                        from: transactions.length > 0 ? 1 : 0,
                        to: transactions.length,
                        total: totalCount,
                    })}
                </p>

                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled
                        className="rounded border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                        1
                    </button>
                    <button
                        type="button"
                        className="rounded border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                        2
                    </button>
                    <button
                        type="button"
                        className="rounded border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                        3
                    </button>
                    <button
                        type="button"
                        className="rounded border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
