import type { ReportTransaction } from "@/components/report/types";
import type { RecentTransaction } from "@/shared/types/dashboard.types";

const DATE_LOCALES: Record<string, string> = {
    fr: "fr-FR",
    en: "en-US",
};

function formatPurchaseDate(value: string, locale: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString(DATE_LOCALES[locale] ?? locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatStatus(status: string): string {
    if (!status) return "—";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

/** Mappe une transaction API vers le modèle affiché dans le tableau. */
export function mapRecentTransaction(
    transaction: RecentTransaction,
    locale: string
): ReportTransaction {
    return {
        id: String(transaction.id),
        name: transaction.name,
        email: transaction.email,
        ticketType: transaction.ticketType,
        purchaseDate: formatPurchaseDate(transaction.purchaseDate, locale),
        status: formatStatus(transaction.status),
        amount: transaction.amount,
    };
}

export function mapRecentTransactions(
    transactions: RecentTransaction[] | undefined,
    locale: string
): ReportTransaction[] {
    return (transactions ?? []).map((tx) => mapRecentTransaction(tx, locale));
}
