import {PublicEvent} from "@/shared/types/public-event.types";
import RichTextContent from "@/components/website/RichTextContent";
import { useTranslations } from "next-intl";


type Props = {
    event: PublicEvent;
};

export default function EventAbout({ event }: Props) {
    const t = useTranslations("eventDetail");
    const description = event.description || event.shortDescription;

    return (
        <section className="py-8">
            <h2 className="mb-6 font-bold text-[#131827]">{t("about")}</h2>

            <RichTextContent
                html={description}
                fallback={t("noDescription")}
            />

            <ul className="mt-8 space-y-3 text-gray-700">
                <li>{t("category")}: {event.category?.name}</li>
                <li>{t("type")}: {event.type}</li>
                <li>{t("capacity")}: {event.capacity}</li>
                <li>{t("timezone")}: {event.timezone}</li>
            </ul>
        </section>
    );
}
