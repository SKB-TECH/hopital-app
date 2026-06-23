import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import AuthShell from "@/components/auth/AuthShell";

export default function OtpVerificationPage() {
    const t = useTranslations("auth.otp");

    return (
        <AuthShell>
            <div className="w-full max-w-[430px] rounded bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded bg-blue-50">
                    <div className="flex size-9 items-center justify-center rounded border border-blue-100 bg-white text-blue-600 shadow-sm">
                        <Mail className="size-4" />
                    </div>
                </div>

                <div className="text-center">
                    <h1 className="text-[22px] font-extrabold text-slate-900">
                        {t("title")}
                    </h1>
                    <p className="mx-auto mt-2 max-w-[280px] text-sm leading-5 text-slate-500">
                        {t("description")}{" "}
                        <span className="font-semibold text-slate-700">
              johndoe@example.com
            </span>
                    </p>
                </div>

                <div className="mt-7 flex justify-center gap-3">
                    {["6", "8", "4", "", ""].map((item, index) => (
                        <input
                            key={index}
                            maxLength={1}
                            defaultValue={item}
                            className={`size-12 rounded border text-center text-lg font-bold text-slate-900 outline-none focus:ring-4 ${
                                index === 2
                                    ? "border-blue-500 bg-blue-50 focus:ring-blue-100"
                                    : "border-slate-200 bg-white focus:border-blue-500 focus:ring-blue-100"
                            }`}
                        />
                    ))}
                </div>

                <button
                    type="button"
                    className="mt-6 h-11 w-full rounded bg-blue-600 text-sm font-semibold text-white"
                >
                    {t("submit")}
                </button>

                <p className="mt-6 text-center text-sm text-slate-500">
                    {t("resend")}{" "}
                    <span className="font-semibold text-blue-600">00:37</span>
                </p>
            </div>
        </AuthShell>
    );
}
