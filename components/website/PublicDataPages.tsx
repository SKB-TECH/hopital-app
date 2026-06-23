"use client";

import Image from "next/image";
import { Check, Ticket } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { EventCard } from "@/components/website/EventCards";
import { WebsiteFooter, WebsiteNav, SocialButtons } from "@/components/website/SiteChrome";
import { LocalizedLink } from "@/components/website/LocalizedLink";
import { useGetPublicEvents } from "@/shared/hooks/public-event.hooks";
import { portalService } from "@/shared/services/portal.service";
import { useEffect, useState } from "react";

type PublicListProps = {
  mode: "category" | "city";
  slug: string;
  title: string;
};

export function PublicEventsListPage({ mode, slug, title }: PublicListProps) {
  const query = useGetPublicEvents({
    page: 1,
    limit: 24,
    ...(mode === "category" ? { category: slug } : { city: title }),
  });

  const events = query.data?.events ?? [];
  const heroImage = events[0]?.bannerUrl;

  return (
    <main className="bg-[#F5F7FC]">
      <WebsiteNav />
      <section className="relative h-[420px] overflow-hidden bg-[#131827] text-white">
        {heroImage && <Image src={heroImage} alt={title} fill className="object-cover opacity-60" />}
        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-16 md:px-10">
          <p className="text-sm font-extrabold uppercase tracking-widest text-[#27B7F5]">
            {mode === "category" ? "Catégorie" : "Ville"}
          </p>
          <h1 className="mt-4 text-5xl font-extrabold md:text-6xl">{title}</h1>
          <p className="mt-4 text-xl text-white/80">
            {query.isLoading ? "Chargement..." : `${events.length} événement(s) disponible(s)`}
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        {query.isError && <EmptyState title="Impossible de charger les événements." />}
        {!query.isLoading && !query.isError && events.length === 0 && (
          <EmptyState title="Aucun événement réel trouvé pour cette page." />
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => <EventCard key={event.id} event={event} compact />)}
        </div>
      </section>
      <WebsiteFooter />
    </main>
  );
}

export function PublicOrganizerPage({ slug }: { slug: string }) {
  const query = useGetPublicEvents({ page: 1, limit: 100 });
  const normalizedSlug = slug.toLowerCase();
  const events = (query.data?.events ?? []).filter((event) => {
    const displayName = event.organizer?.displayName || "";
    const organizerSlug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return organizerSlug === normalizedSlug || event.organizer?.id === slug;
  });
  const organizer = events[0]?.organizer;

  return (
    <main className="bg-[#F5F7FC]">
      <WebsiteNav active="Organizer" />
      <section className="relative h-[340px] bg-[#131827]">
        {events[0]?.bannerUrl && <Image src={events[0].bannerUrl} alt={organizer?.displayName || "Organizer"} fill className="object-cover opacity-60" />}
      </section>
      <section className="mx-auto max-w-7xl px-6 py-12 md:px-10">
        {query.isLoading && <EmptyState title="Chargement de l'organisateur..." />}
        {!query.isLoading && !organizer && <EmptyState title="Aucun organisateur réel trouvé." />}
        {organizer && (
          <>
            <div className="rounded-xl border bg-white p-8 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-widest text-[#005995]">
                {organizer.isVerified ? "Organisateur vérifié" : "Organisateur"}
              </p>
              <h1 className="mt-3 text-4xl font-extrabold">{organizer.displayName}</h1>
              {organizer.description && <p className="mt-4 max-w-3xl text-slate-600">{organizer.description}</p>}
              <p className="mt-5 font-bold text-slate-600">{events.length} événement(s) publié(s)</p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          </>
        )}
      </section>
      <WebsiteFooter />
    </main>
  );
}

export function PublicOrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!!orderId);

  useEffect(() => {
    if (!orderId) return;
    portalService
      .orders({ limit: 50 })
      .then((response) => {
        const found = (response?.data || []).find((item: any) => item.id === orderId);
        setOrder(found || null);
      })
      .finally(() => setIsLoading(false));
  }, [orderId]);

  return (
    <main className="bg-[#F5F7FC]">
      <WebsiteNav />
      <section className="mx-auto max-w-7xl px-6 py-20 text-center md:px-10">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#DDEAF6] text-[#005995]">
          <Check className="h-14 w-14" />
        </div>
        <h1 className="mt-10 text-5xl font-extrabold">Commande confirmée</h1>
        {!orderId && <p className="mt-5 text-xl text-slate-600">Aucune commande réelle n'a été fournie à cette page.</p>}
        {isLoading && <p className="mt-5 text-xl text-slate-600">Chargement de la commande...</p>}
        {orderId && !isLoading && !order && <p className="mt-5 text-xl text-slate-600">Commande introuvable dans votre compte.</p>}
        {order && (
          <div className="mx-auto mt-12 max-w-2xl rounded-xl border bg-white p-8 text-left shadow-sm">
            <p className="font-extrabold uppercase tracking-widest text-slate-500">Order ID</p>
            <h2 className="text-3xl font-extrabold">#{order.id}</h2>
            <p className="mt-6 text-lg">Statut: {order.status}</p>
            <p className="mt-2 text-lg">Total: {order.total} {order.currency}</p>
          </div>
        )}
        <div className="mt-10">
          <SocialButtons />
        </div>
      </section>
      <WebsiteFooter />
    </main>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
      <Ticket className="mx-auto h-12 w-12 text-slate-300" />
      <h2 className="mt-4 text-2xl font-extrabold text-[#131827]">{title}</h2>
      <LocalizedLink href="/discover" className="mt-6 inline-flex rounded-lg bg-[#005995] px-6 py-3 font-bold text-white">
        Voir les événements
      </LocalizedLink>
    </div>
  );
}
