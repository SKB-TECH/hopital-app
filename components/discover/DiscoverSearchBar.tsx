"use client";

import { useEffect, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
    defaultQ?: string;
    defaultCity?: string;
    onSearch: (q: string, city: string) => void;
};

export default function DiscoverSearchBar({
                                              defaultQ = "",
                                              defaultCity = "",
                                              onSearch,
                                          }: Props) {
    const t = useTranslations("discover");

    const [q, setQ] = useState(defaultQ);
    const [city, setCity] = useState(defaultCity);

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(q, city);
        }, 500);

        return () => clearTimeout(timer);
    }, [q, city, onSearch]);

    return (
        <div className="mt-10 flex w-full items-center rounded-full bg-white p-3 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-1 items-center gap-4 px-5">
                <Search className="h-6 w-6 text-[#0067A8]" />

                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="w-full bg-transparent text-gray-700 outline-none"
                />
            </div>

            <div className="hidden h-10 w-px bg-gray-200 md:block" />

            <div className="hidden flex-1 items-center gap-4 px-5 md:flex">
                <MapPin className="h-6 w-6 text-[#0067A8]" />

                <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t("location")}
                    className="w-full bg-transparent text-gray-700 outline-none"
                />
            </div>

            <button
                type="button"
                onClick={() => onSearch(q, city)}
                className="rounded-full bg-[#0067A8] px-9 py-4 font-bold text-white"
            >
                {t("searchButton")}
            </button>
        </div>
    );
}
