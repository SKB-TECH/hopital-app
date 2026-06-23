"use client";

import { useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";
import ReactCountryFlag from "react-country-flag";

import { usePathname, useRouter } from "@/i18n/navigation";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Language = {
    code: "fr" | "en";
    label: string;
    country: string;
};

const languages: Language[] = [
    {
        code: "fr",
        label: "Français",
        country: "FR",
    },
    {
        code: "en",
        label: "English",
        country: "US",
    },
];

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const [isPending, startTransition] = useTransition();

    const currentLanguage =
        languages.find((language) => language.code === locale) ?? languages[0];

    const changeLanguage = (newLocale: Language["code"]) => {
        startTransition(() => {
            router.replace(pathname, { locale: newLocale });
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    disabled={isPending}
                    className="
                    flex h-10 items-center gap-2 rounded
                    border border-slate-200 bg-white
                    px-3 text-sm font-semibold text-slate-700
                    shadow-none transition
                    hover:border-slate-300 hover:bg-slate-50
                    disabled:cursor-not-allowed disabled:opacity-60
          "
                >
                    <ReactCountryFlag
                        svg
                        countryCode={currentLanguage.country}
                        style={{
                            width: "1.35em",
                            height: "1.35em",
                            borderRadius: "999px",
                            objectFit: "cover",
                        }}
                    />

                    <span className="hidden sm:inline">{currentLanguage.label}</span>

                    <ChevronDown className="size-4 text-slate-400" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="
          w-fit rounded border border-slate-200
          bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.08)]
        "
            >
                {languages.map((language) => {
                    const active = locale === language.code;

                    return (
                        <DropdownMenuItem
                            key={language.code}
                            onClick={() => changeLanguage(language.code)}
                            disabled={isPending}
                            className="
                flex cursor-pointer items-center justify-between
                rounded px-3 py-3 outline-none transition
                hover:bg-slate-100
                disabled:cursor-not-allowed disabled:opacity-60
              "
                        >
                            <div className="flex items-center gap-3">
                                <ReactCountryFlag
                                    svg
                                    countryCode={language.country}
                                    style={{
                                        width: "1.45em",
                                        height: "1.45em",
                                        borderRadius: "999px",
                                        objectFit: "cover",
                                    }}
                                />
                            </div>

                            {active ? <Check className="size-4 text-blue-600" /> : null}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
