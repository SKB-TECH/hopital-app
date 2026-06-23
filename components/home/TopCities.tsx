import Image from "next/image";
import { useTranslations } from "next-intl";

type City = {
    id: string;
    name: string;
    eventsCount: number;
    image?: string;
};

type Props = {
    cities: City[];
};

export default function TopCities({ cities }: Props) {
    const t = useTranslations("home.cities");

    if (!cities.length) return null;

    return (
        <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
            <h2 className="text-3xl font-extrabold text-[#131827]">
                {t("title")}
            </h2>

            <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                {cities.slice(0, 4).map((city) => (
                    <div key={city.id} className="text-center">
                        <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-full shadow-md">
                            <Image
                                src={city.image || "/images/heroo.png"}
                                alt={city.name}
                                fill
                                className="object-cover"
                            />
                        </div>

                        <h3 className="mt-5 font-bold text-[#131827]">{city.name}</h3>

                        <p className="text-sm text-gray-500">
                            {city.eventsCount} {t("events")}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
