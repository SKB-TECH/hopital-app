import { useTranslations } from "next-intl";

export default function NewsletterSection() {
    const t = useTranslations("home.newsletter");

    return (
        <section className="mx-auto max-w-7xl px-6 pb-24 md:px-10">
            <div className="rounded-2xl bg-[#0067A8] px-8 py-12 text-white shadow-2xl md:px-14">
                <div className="grid gap-8 md:grid-cols-[1fr_520px] md:items-center">
                    <div>
                        <h2 className="text-3xl font-extrabold">{t("title")}</h2>
                        <p className="mt-3 max-w-xl text-white/80">{t("subtitle")}</p>
                    </div>

                    <form className="rounded-xl bg-white/15 p-3 backdrop-blur">
                        <div className="flex gap-3">
                            <input
                                type="email"
                                placeholder={t("placeholder")}
                                className="min-w-0 flex-1 rounded-lg bg-white px-5 py-4 text-sm text-gray-900 outline-none"
                            />
                            <button
                                type="submit"
                                className="rounded-lg bg-white px-6 py-4 text-sm font-bold text-[#0067A8]"
                            >
                                {t("button")}
                            </button>
                        </div>
                        <p className="mt-3 text-xs text-white/70">{t("terms")}</p>
                    </form>
                </div>
            </div>
        </section>
    );
}
