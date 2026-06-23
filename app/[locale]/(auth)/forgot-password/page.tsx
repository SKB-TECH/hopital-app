import { LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";
import AuthShell from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
    const t = useTranslations("auth.forgot");

    return (
        <AuthShell>
            <div className="w-full max-w-[430px] rounded bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded bg-blue-50">
                    <div className="flex size-9 items-center justify-center rounded border border-blue-100 bg-white text-blue-600 shadow-sm">
                        <LockKeyhole className="size-4" />
                    </div>
                </div>

                <div className="text-center">
                    <h1 className="text-[22px] font-extrabold text-slate-900">
                        {t("title")}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">{t("description")}</p>
                </div>

                <form className="mt-7 space-y-4">
                    <div>
                        <label className="mb-2 block text-xs font-semibold text-slate-700">
                            {t("email")}
                        </label>
                        <input
                            defaultValue="johndoe@example.com"
                            className="h-10 w-full rounded border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </div>

                    <button
                        type="button"
                        className="h-11 w-full rounded bg-blue-600 text-sm font-semibold text-white"
                    >
                        {t("submit")}
                    </button>
                </form>

                <p className="mt-7 text-center text-sm text-slate-500">
                    {t("noAccess")}
                    <br />
                    <a href="../login" className="font-semibold text-blue-600">
                        {t("tryAnother")}
                    </a>
                </p>
            </div>
        </AuthShell>
    );
}
