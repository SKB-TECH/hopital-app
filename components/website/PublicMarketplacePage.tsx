"use client";

import Image from "next/image";
import { ArrowLeft, Search, ShoppingBag, Ticket, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { WebsiteFooter, WebsiteNav } from "@/components/website/SiteChrome";
import { LocalizedLink } from "@/components/website/LocalizedLink";
import { useGetPublicMarketplaceItem, useGetPublicMarketplaceItems } from "@/shared/hooks/public-marketplace.hooks";
import type { PublicMarketplaceItem } from "@/shared/types/marketplace.types";

function formatMoney(amount: number, currency: string) {
  return `${amount.toLocaleString("fr-FR")} ${currency}`;
}

export function PublicMarketplacePage() {
  const t = useTranslations("marketplace");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const marketplaceQuery = useGetPublicMarketplaceItems({
    page: 1,
    limit: 24,
    q: submittedQuery || undefined,
  });

  const items = marketplaceQuery.data?.items ?? [];
  const title = useMemo(() => {
    if (marketplaceQuery.isLoading) return t("loadingTitle");
    if (submittedQuery) return t("resultsTitle", { query: submittedQuery });
    return t("title");
  }, [marketplaceQuery.isLoading, submittedQuery, t]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  };

  return (
    <main className="min-h-screen bg-[#F5F7FC]">
      <WebsiteNav active={t("title")} />
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10">
          <p className="text-sm font-extrabold uppercase tracking-widest text-[#005995]">{t("eyebrow")}</p>
          <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-[#131827] md:text-6xl">
            {title}
          </h1>
          <form onSubmit={submitSearch} className="mt-10 flex max-w-3xl overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="flex flex-1 items-center gap-4 px-5">
              <Search className="h-5 w-5 text-[#005995]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="min-h-14 flex-1 bg-transparent text-base outline-none"
              />
            </div>
            <button className="bg-[#005995] px-7 font-extrabold text-white hover:bg-[#004b7d]">
              {t("search")}
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10">
        {marketplaceQuery.isError && (
          <MarketplaceEmpty title={t("loadError")} />
        )}
        {!marketplaceQuery.isLoading && !marketplaceQuery.isError && items.length === 0 && (
          <MarketplaceEmpty title={t("empty")} />
        )}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <MarketplaceCard key={item.id} item={item} />
          ))}
        </div>
      </section>
      <WebsiteFooter />
    </main>
  );
}

function MarketplaceCard({ item }: { item: PublicMarketplaceItem }) {
  const t = useTranslations("marketplace");
  const venue = [item.event?.venue?.city, item.event?.venue?.name].filter(Boolean).join(", ");

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-56 bg-slate-100">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <ShoppingBag className="h-16 w-16" />
          </div>
        )}
        <span className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#005995]">
          {formatMoney(item.price, item.currency)}
        </span>
      </div>
      <div className="space-y-4 p-6">
        <div>
          <h2 className="line-clamp-2 text-2xl font-extrabold text-[#131827]">{item.name}</h2>
          {item.description && (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p>
          )}
        </div>
        {item.stock !== null && item.stock !== undefined && (
          <p className="text-sm font-bold text-slate-500">
            {t("stock")}: {item.stock.toLocaleString("fr-FR")}
          </p>
        )}
        {item.event && (
          <div className="rounded-lg bg-[#F1F6FB] p-4">
            <p className="flex items-center gap-2 text-sm font-extrabold text-[#005995]">
              <Ticket className="h-4 w-4" />
              {item.event.title}
            </p>
            {venue && (
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4" />
                {venue}
              </p>
            )}
          </div>
        )}
        {item.event?.slug && (
          <LocalizedLink href={`/events/${item.event.slug}`} className="text-sm font-extrabold text-[#005995]">
            {t("viewEvent")}
          </LocalizedLink>
        )}
        <LocalizedLink
          href={`/marketplace/${item.id}`}
          className="inline-flex w-full justify-center rounded-lg bg-[#005995] px-5 py-3 font-extrabold text-white"
        >
          {t("viewItem")}
        </LocalizedLink>
      </div>
    </article>
  );
}

export function PublicMarketplaceItemPage({ id }: { id: string }) {
  const t = useTranslations("marketplace");
  const query = useGetPublicMarketplaceItem(id);
  const item = query.data;
  const venue = [item?.event?.venue?.city, item?.event?.venue?.name].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen bg-[#F5F7FC]">
      <WebsiteNav active={t("title")} />
      <section className="mx-auto max-w-7xl px-6 py-12 md:px-10">
        <LocalizedLink href="/marketplace" className="inline-flex items-center gap-2 font-extrabold text-[#005995]">
          <ArrowLeft className="h-4 w-4" />
          {t("title")}
        </LocalizedLink>

        {query.isLoading && (
          <div className="mt-10 rounded-xl border bg-white p-10 text-center shadow-sm">
            {t("loadingItem")}
          </div>
        )}

        {query.isError && (
          <MarketplaceEmpty title={t("itemNotFound")} />
        )}

        {item && (
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
              <div className="relative h-[460px] bg-slate-100">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <ShoppingBag className="h-24 w-24" />
                  </div>
                )}
              </div>
            </div>

            <aside className="h-fit rounded-xl border bg-white p-7 shadow-sm">
              <p className="text-sm font-extrabold uppercase tracking-widest text-[#005995]">Marketplace</p>
              <h1 className="mt-3 text-4xl font-extrabold leading-tight text-[#131827]">{item.name}</h1>
              <p className="mt-5 text-3xl font-extrabold text-[#005995]">
                {formatMoney(item.price, item.currency)}
              </p>
              {item.stock !== null && item.stock !== undefined && (
                <p className="mt-3 font-bold text-slate-500">
                  {t("stock")}: {item.stock.toLocaleString("fr-FR")}
                </p>
              )}
              {item.description && (
                <p className="mt-6 leading-8 text-slate-600">{item.description}</p>
              )}

              {item.event && (
                <div className="mt-7 rounded-xl bg-[#F1F6FB] p-5">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-[#005995]">
                    <Ticket className="h-4 w-4" />
                    {item.event.title}
                  </p>
                  {venue && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4" />
                      {venue}
                    </p>
                  )}
                  <LocalizedLink
                    href={`/events/${item.event.slug}`}
                    className="mt-5 inline-flex rounded-lg bg-white px-5 py-3 font-extrabold text-[#005995]"
                  >
                    {t("viewEvent")}
                  </LocalizedLink>
                </div>
              )}
            </aside>
          </div>
        )}
      </section>
      <WebsiteFooter />
    </main>
  );
}

function MarketplaceEmpty({ title }: { title: string }) {
  const t = useTranslations("marketplace");
  return (
    <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
      <ShoppingBag className="mx-auto h-12 w-12 text-slate-300" />
      <h2 className="mt-4 text-2xl font-extrabold text-[#131827]">{title}</h2>
      <LocalizedLink href="/discover" className="mt-6 inline-flex rounded-lg bg-[#005995] px-6 py-3 font-bold text-white">
        {t("viewEvents")}
      </LocalizedLink>
    </div>
  );
}
