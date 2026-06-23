"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useLocalizedPath } from "@/shared/hooks/useLocalizedPath";
import { BrandLogo } from "@/components/website/BrandLogo";
import { LanguageToggle } from "@/components/website/LanguageToggle";

export default function Navbar() {
    const t = useTranslations("navigation");
    const { getLocalizedHref } = useLocalizedPath();

    return (
        <header className="absolute left-0 top-0 z-50 w-full bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 md:px-10">
                <Link href={getLocalizedHref("/")}>
                    <BrandLogo size="sm" />
                </Link>

                <nav className="hidden items-center gap-6 text-sm font-semibold text-gray-800 md:flex">
                    <Link href={getLocalizedHref("/")}>{t("home")}</Link>
                    <Link href={getLocalizedHref("/discover")}>{t("events")}</Link>
                    <Link href={getLocalizedHref("/marketplace")}>{t("marketplace")}</Link>
                    <Link href={getLocalizedHref("/buses")}>{t("buses")}</Link>
                    <Link href={getLocalizedHref("/flights")}>{t("flights")}</Link>
                    <Link href={getLocalizedHref("/vouchers")}>{t("vouchers")}</Link>
                    <Link href={getLocalizedHref("/stay")}>{t("stay")}</Link>
                </nav>

                <div className="flex items-center gap-3">
                    <LanguageToggle />

                    <Link
                        href={getLocalizedHref("/auth?mode=login")}
                        className="hidden rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors md:block"
                    >
                        {t("login")}
                    </Link>

                    <Link
                        href={getLocalizedHref("/auth?mode=register")}
                        className="rounded-xl bg-[#0067A8] px-5 py-3 text-sm font-bold text-white hover:bg-[#005690] transition-colors"
                    >
                        {t("signup")}
                    </Link>
                </div>
            </div>
        </header>
    );
}
