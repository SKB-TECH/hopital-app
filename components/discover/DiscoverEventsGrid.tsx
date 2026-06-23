import type { PublicEvent } from "@/shared/types/public-event.types";
import DiscoverEventCard from "./DiscoverEventCard";

type Props = {
    events: PublicEvent[];
    isLoading: boolean;
    isError: boolean;
};

export default function DiscoverEventsGrid({
                                               events,
                                               isLoading,
                                               isError,
                                           }: Props) {
    if (isLoading) {
        return (
            <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-[360px] animate-pulse rounded-2xl bg-white"
                    />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-2xl bg-white p-10 text-center text-red-500">
                Impossible de charger les événements.
            </div>
        );
    }

    if (!events.length) {
        return (
            <div className="rounded-2xl bg-white p-10 text-center text-gray-500">
                Aucun événement trouvé.
            </div>
        );
    }

    return (
        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
                <DiscoverEventCard key={event.id} event={event} />
            ))}
        </div>
    );
}
