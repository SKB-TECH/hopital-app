import { Briefcase, Drama, Dumbbell, Music, Palette, Utensils } from "lucide-react";
import { useTranslations } from "next-intl";

type Category = {
    id: string;
    name: string;
    slug: string;
};

type Props = {
    categories: Category[];
};

const icons = [Music, Utensils, Palette, Dumbbell, Drama, Briefcase];

export default function CategoriesSection({ categories }: Props) {
    const t = useTranslations("home.categories");

    if (!categories.length) return null;

    return (
        <section className="bg-white py-20">
            <div className="mx-auto max-w-7xl px-6 text-center md:px-10">
                <h2 className="text-3xl font-extrabold text-[#131827]">
                    {t("title")}
                </h2>

                <p className="mt-2 text-gray-600">{t("subtitle")}</p>

                <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
                    {categories.slice(0, 6).map((category, index) => {
                        const Icon = icons[index] || Music;

                        return (
                            <div key={category.id} className="flex flex-col items-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F0F2F8]">
                                    <Icon className="h-6 w-6 text-[#131827]" />
                                </div>

                                <p className="mt-4 text-sm font-semibold text-[#131827]">
                                    {category.name}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
