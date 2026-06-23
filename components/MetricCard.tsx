import { Info, TrendingUp } from "lucide-react";

export default function MetricCard({ icon, title, value, trend, trendUp,}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <div className="bg-white rounded border border-slate-200 p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded bg-blue-50 text-blue-600">
        {icon}
        </div>
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