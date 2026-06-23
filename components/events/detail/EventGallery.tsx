import Image from "next/image";
import {PublicEvent} from "@/shared/types/public-event.types";
import { useTranslations } from "next-intl";


type Props = {
    event: PublicEvent;
};

function getGalleryImages(event: PublicEvent) {
    const media =
        event.mediaFiles
            ?.map((file: any) => file?.url || file?.fileUrl || file?.imageUrl)
            .filter(Boolean) ?? [];

    return [event.bannerUrl, ...media].filter(Boolean).slice(0, 5);
}

export default function EventGallery({ event }: Props) {
    const t = useTranslations("eventDetail");
    const images = getGalleryImages(event);

    if (!images.length) return null;

    return (
        <section className="py-12">
            <h2 className="mb-6 font-bold text-[#131827]">{t("gallery")}</h2>

            <div className="grid h-[390px] grid-cols-3 gap-4">
                <div className="relative col-span-2 row-span-2 overflow-hidden rounded-2xl bg-gray-200">
                    <Image
                        src={images[0]}
                        alt={event.title}
                        fill
                        className="object-cover"
                    />
                </div>

                {images.slice(1, 5).map((image, index) => (
                    <div
                        key={image}
                        className="relative overflow-hidden rounded-2xl bg-gray-200"
                    >
                        <Image
                            src={image}
                            alt={`${event.title} ${index + 1}`}
                            fill
                            className="object-cover"
                        />

                        {index === 3 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xl font-bold text-white">
                                +12 {t("more")}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
