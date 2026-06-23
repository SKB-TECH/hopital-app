import Image from "next/image";
import {PublicEvent} from "@/shared/types/public-event.types";

type Props = {
    event: PublicEvent;
};

export default function EventDetailHero({ event }: Props) {
    return (
        <section className="relative h-[560px] overflow-hidden bg-black text-white">
            <Image
                src={event.bannerUrl || "/images/heroo.png"}
                alt={event.title}
                fill
                priority
                className="object-cover"
            />

            <div className="absolute inset-0 bg-black/45" />
            <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/80 to-transparent" />

            <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-6 pb-16">
                <div className="max-w-4xl">
          <span className="rounded-full bg-[#0067A8] px-4 py-2 text-xs font-bold uppercase">
            {event.category?.name}
          </span>

                    <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-[-0.04em] md:text-6xl">
                        {event.title}
                    </h1>
                </div>
            </div>
        </section>
    );
}
