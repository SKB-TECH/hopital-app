export function getTransactionStatusColor(status: string): string {
    switch (status.toLowerCase()) {
        case "paid":
            return "bg-emerald-50 text-emerald-600 border-emerald-200";
        case "cancelled":
            return "bg-rose-50 text-rose-600 border-rose-200";
        case "refunded":
            return "bg-amber-50 text-amber-600 border-amber-200";
        default:
            return "bg-slate-50 text-slate-600 border-slate-200";
    }
}
