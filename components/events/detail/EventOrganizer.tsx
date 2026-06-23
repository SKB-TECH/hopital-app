import { CheckCircle, UserPlus } from "lucide-react";
import {PublicEvent} from "@/shared/types/public-event.types";
import { useTranslations } from "next-intl";


type Props = {
    event: PublicEvent;
};

export default function EventOrganizer({ event }: Props) {
    const t = useTranslations("eventDetail");

    return (
        <div className="flex items-center justify-between border-b border-gray-200 pb-10">
            <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E7F3FB] text-xl font-bold text-[#0067A8]">
                    {event.organizer?.displayName?.slice(0, 2).toUpperCase()}
                </div>

                <div>
                    <p className="text-sm text-gray-500">{t("organizedBy")}</p>

                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#0067A8]">
                            {event.organizer?.displayName}
                        </h3>

                        {event.organizer?.isVerified && (
                            <CheckCircle className="h-4 w-4 text-[#0067A8]" />
                        )}
                    </div>
                </div>
            </div>

            <button className="hidden items-center gap-2 rounded-lg border border-[#0067A8] px-5 py-3 text-sm font-bold text-[#0067A8] md:flex">
                <UserPlus className="h-4 w-4" />
                {t("follow")}
            </button>
        </div>
    );
}
