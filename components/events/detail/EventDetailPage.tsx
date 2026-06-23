"use client";

import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";
import EventDetailHero from "./EventDetailHero";
import EventOrganizer from "./EventOrganizer";
import EventGallery from "./EventGallery";
import EventAbout from "./EventAbout";
import EventLocation from "./EventLocation";
import EventTicketCard from "./EventTicketCard";
import RelatedEvents from "./RelatedEvents";
import EventMarketplace from "./EventMarketplace";
import EventReviews from "./EventReviews";
import EventPublicActions from "./EventPublicActions";
import {useGetPublicEventBySlug, useGetUpcomingPublicEvents} from "@/shared/hooks/public-event.hooks";
import Nav from "@/components/home/Nav";


type Props = {
    slug: string;
};

export default function EventDetailPage({ slug }: Props) {
    const { data: event, isLoading, isError } = useGetPublicEventBySlug(slug);

    const { data: relatedData } = useGetUpcomingPublicEvents({
        page: 1,
        limit: 3,
    });

    const relatedEvents =
        relatedData?.events?.filter((item) => item.slug !== slug).slice(0, 3) ?? [];

    if (isLoading) {
        return (
            <main className="min-h-screen bg-[#F5F7FC]">
                <Nav/>
                <div className="mx-auto max-w-7xl px-6 py-20 text-center">
                    Loading event...
                </div>
            </main>
        );
    }

    if (isError || !event) {
        return (
            <main className="min-h-screen bg-[#F5F7FC]">
                <Nav />
                <div className="mx-auto max-w-7xl px-6 py-20 text-center text-red-500">
                    Event not found.
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#F5F7FC]">
            <Nav/>

            <EventDetailHero event={event} />

            <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1fr_360px]">
                <div>
                    <EventPublicActions
                        slug={event.slug}
                        initialLikeCount={event.likeCount ?? 0}
                        initialReviewCount={event.reviewCount ?? 0}
                    />
                    <EventOrganizer event={event} />
                    <EventGallery event={event} />
                    <EventAbout event={event} />
                    <EventReviews slug={event.slug} />
                    <EventLocation event={event} />
                    <EventMarketplace event={event} />
                </div>

                <EventTicketCard event={event} />
            </section>

            <RelatedEvents events={relatedEvents} />

            <Footer />
        </main>
    );
}
