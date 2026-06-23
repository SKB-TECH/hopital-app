import { ExternalLink } from "lucide-react";
import {PublicEvent} from "@/shared/types/public-event.types";
import { useTranslations } from "next-intl";


type Props = {
    event: PublicEvent;
};

export default function EventLocation({ event }: Props) {
    const t = useTranslations("eventDetail");
    const venue = event.venue;

    if (!venue) return null;

    const mapQuery = encodeURIComponent(
        `${venue.name}, ${venue.address}, ${venue.city}, ${venue.country}`
    );

    return (
        <section className="py-12">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="font-bold text-[#131827]">{t("location")}</h2>

                <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    className="flex items-center gap-1 text-sm font-bold text-[#0067A8]"
                >
                    {t("getDirections")} <ExternalLink className="h-4 w-4" />
                </a>
            </div>

            <div className="relative h-[360px] overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-900">
                <div className="absolute bottom-8 left-8 rounded-xl bg-white p-6 shadow-lg">
                    <h3 className="font-bold text-[#131827]">{venue.name}</h3>
                    <p className="mt-2 max-w-xs text-sm text-gray-600">
                        {venue.address}, {venue.city}, {venue.country}
                    </p>
                </div>
            </div>
        </section>
    );
}
