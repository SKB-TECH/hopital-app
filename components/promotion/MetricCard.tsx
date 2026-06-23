import { Info } from "lucide-react";

type MetricCardProps = {
    icon: React.ReactNode;
    title: string;
    value: string;
    isLoading?: boolean;
};

export function MetricCard({ icon, title, value, isLoading = false }: MetricCardProps) {
    return (
        <div className="rounded border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="mb-4 flex items-start justify-between">
                <div className="rounded bg-blue-50 p-3 text-blue-600">{icon}</div>
                <Info className="size-4 cursor-pointer text-slate-300 transition-colors hover:text-slate-400" />
            </div>

            <p className="mb-1 text-sm text-slate-500">{title}</p>

            {isLoading ? (
                <div
                    className="h-8 w-32 animate-pulse rounded bg-slate-100"
                    aria-busy="true"
                    aria-label={title}
                />
            ) : (
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            )}
        </div>
    );
}
