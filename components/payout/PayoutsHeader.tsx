import { Download, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

type PayoutsHeaderProps = {
    onAddPayment: () => void;
};

export function PayoutsHeader({ onAddPayment }: PayoutsHeaderProps) {
    const t = useTranslations("payoutsAdmin");

    return (
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-950">{t("title")}</h1>
                <p className="mt-1 text-sm text-slate-500">
                    {t("breadcrumbManagement")} /{" "}
                    <span className="font-medium text-slate-900">{t("title")}</span>
                </p>
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
                >
                    <Download className="size-4" />
                    {t("exportCsv")}
                </button>
                <button
                    type="button"
                    onClick={onAddPayment}
                    className="inline-flex items-center gap-2 rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md"
                >
                    <Plus className="size-4" />
                    {t("addPayment")}
                </button>
            </div>
        </div>
    );
}
