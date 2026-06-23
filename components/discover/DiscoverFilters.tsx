"use client";

import { useTranslations } from "next-intl";

type Category = {
    id: string;
    name: string;
    slug: string;
};

export type DateFilter = "" | "today" | "weekend" | "next-week";

type Props = {
    categories: Category[];
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    selectedDateFilter: DateFilter;
    onDateFilterChange: (filter: DateFilter) => void;
    maxPrice?: number;
    onMaxPriceChange: (price?: number) => void;
    distance?: number;
    onDistanceChange: (distance?: number) => void;
    onReset: () => void;
};

const dateFilters: Array<{ value: DateFilter; labelKey: string }> = [
    { value: "", labelKey: "anytime" },
    { value: "today", labelKey: "today" },
    { value: "weekend", labelKey: "thisWeekend" },
    { value: "next-week", labelKey: "nextWeek" },
];

const distanceOptions = [
    { value: 10, labelKey: "within10" },
    { value: 25, labelKey: "within25" },
    { value: 50, labelKey: "within50" },
    { value: undefined, labelKey: "anywhere" },
];

export default function DiscoverFilters({
                                            categories,
                                            selectedCategory,
                                            onCategoryChange,
                                            selectedDateFilter,
                                            onDateFilterChange,
                                            maxPrice,
                                            onMaxPriceChange,
                                            distance,
                                            onDistanceChange,
                                            onReset,
                                        }: Props) {
    const t = useTranslations("discover");

    return (
        <aside className="space-y-9">
            <div>
                <h3 className="mb-4 font-bold text-[#131827]">{t("categories")}</h3>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => onCategoryChange("")}
                        className={`rounded-full border px-5 py-2 text-sm transition ${
                            selectedCategory === ""
                                ? "border-[#0067A8] bg-[#E7F3FB] text-[#0067A8]"
                                : "border-gray-300 text-gray-700 hover:border-[#0067A8]"
                        }`}
                    >
                        {t("all")}
                    </button>

                    {categories.map((category) => (
                        <button
                            type="button"
                            key={category.id}
                            onClick={() => onCategoryChange(category.slug)}
                            className={`rounded-full border px-5 py-2 text-sm transition ${
                                selectedCategory === category.slug
                                    ? "border-[#0067A8] bg-[#E7F3FB] text-[#0067A8]"
                                    : "border-gray-300 text-gray-700 hover:border-[#0067A8]"
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-4 font-bold text-[#131827]">{t("date")}</h3>

                <div className="space-y-4 text-gray-600">
                    {dateFilters.map((item) => (
                        <label key={item.labelKey} className="flex items-center gap-3">
                            <input
                                type="radio"
                                name="dateFilter"
                                checked={selectedDateFilter === item.value}
                                onChange={() => onDateFilterChange(item.value)}
                                className="h-5 w-5 rounded border-gray-300 accent-[#0067A8]"
                            />
                            <span>{t(item.labelKey)}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="mb-4 font-bold text-[#131827]">{t("priceRange")}</h3>

                <input
                    type="range"
                    min={0}
                    max={1000}
                    step={25}
                    value={maxPrice ?? 1000}
                    onChange={(event) => {
                        const value = Number(event.target.value);
                        onMaxPriceChange(value >= 1000 ? undefined : value);
                    }}
                    className="w-full accent-[#0067A8]"
                />

                <div className="mt-2 flex justify-between text-sm text-gray-500">
                    <span>{t("free")}</span>
                    <span>$1,000+</span>
                </div>
            </div>

            <div>
                <h3 className="mb-4 font-bold text-[#131827]">{t("distance")}</h3>

                <select
                    value={distance ?? ""}
                    onChange={(event) => {
                        const value = event.target.value;
                        onDistanceChange(value ? Number(value) : undefined);
                    }}
                    className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-4 text-gray-700 outline-none"
                >
                    {distanceOptions.map((option) => (
                        <option key={option.labelKey} value={option.value ?? ""}>
                            {t(option.labelKey)}
                        </option>
                    ))}
                </select>
            </div>

            <button
                type="button"
                onClick={onReset}
                className="w-full rounded-xl border border-gray-400 px-5 py-4 font-bold text-[#131827] transition hover:border-[#0067A8] hover:text-[#0067A8]"
            >
                {t("resetFilters")}
            </button>
        </aside>
    );
}
