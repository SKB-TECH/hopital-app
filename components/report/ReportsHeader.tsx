import { Download } from "lucide-react";
import { useTranslations } from "next-intl";

export function ReportsHeader() {
    const t = useTranslations("reports");

    return (
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-950">{t("title")}</h1>
                <p className="mt-1 text-sm text-slate-500">
                    {t("breadcrumbHome")} /{" "}
                    <span className="font-medium text-slate-900">{t("breadcrumbDashboard")}</span>
                </p>
            </div>

            <button
                type="button"
                className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:shadow-sm"
            >
                <Download className="size-4" />
                {t("exportCsv")}
            </button>
        </div>
    );
}
