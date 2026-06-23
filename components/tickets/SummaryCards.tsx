import { useTranslations } from "next-intl";

type SummaryCardsProps = {
  activeTickets: number;
  soldOutTickets: number;
  totalTickets: number;
  onCreateTicketType?: () => void;
};

export default function SummaryCards({
  activeTickets,
  soldOutTickets,
  totalTickets,
  onCreateTicketType,
}: SummaryCardsProps) {
  const t = useTranslations("tickets");
  const safeTotal = totalTickets > 0 ? totalTickets : 1;
  const activeWidth = (activeTickets / safeTotal) * 100;
  const soldOutWidth = (soldOutTickets / safeTotal) * 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
      <div className="bg-white rounded border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-500 mb-3">{t("summary.statusOverview")}</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">{t("summary.activeTickets")}</span>
          <span className="text-lg font-bold text-emerald-600">{activeTickets}</span>
        </div>
        <div className="w-full bg-slate-100 rounded h-2 mb-3">
          <div className="bg-emerald-500 h-2 rounded" style={{ width: `${activeWidth}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">{t("summary.soldOutTickets")}</span>
          <span className="text-lg font-bold text-rose-600">{soldOutTickets}</span>
        </div>
        <div className="w-full bg-slate-100 rounded h-2">
          <div className="bg-rose-500 h-2 rounded" style={{ width: `${soldOutWidth}%` }} />
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded p-5 text-white">
        <h3 className="text-sm font-semibold text-white/80 mb-2">{t("summary.quickActions")}</h3>
        <p className="text-2xl font-bold mb-3">{t("summary.manageTicketsTitle")}</p>
        <p className="text-sm text-white/70 mb-4">{t("summary.manageTicketsDescription")}</p>
        <button
          type="button"
          onClick={onCreateTicketType}
          className="px-4 py-2 bg-white/20 rounded text-sm font-semibold hover:bg-white/30 transition-colors"
        >
          {t("summary.createTicketType")}
        </button>
      </div>
    </div>
  );
}