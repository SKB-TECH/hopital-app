"use client";

import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import type { PublicEvent } from "@/shared/types/public-event.types";

function formatMoney(amount: number, currency: string) {
    return `${amount.toLocaleString("fr-FR")} ${currency}`;
}

export default function EventMarketplace({ event }: { event: PublicEvent }) {
    const items = event.marketplaceItems ?? [];

    if (!items.length) return null;

    return (
        <section className="mt-12">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#0067A8]">
                        Marketplace
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-[#131827]">
                        Articles liés à cet événement
                    </h2>
                </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
                {items.map((item) => (
                    <article key={item.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                        <div className="relative h-44 bg-slate-100">
                            {item.imageUrl ? (
                                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-slate-300">
                                    <ShoppingBag className="h-12 w-12" />
                                </div>
                            )}
                            <span className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#0067A8]">
                                {formatMoney(item.price, item.currency)}
                            </span>
                        </div>
                        <div className="p-5">
                            <h3 className="text-lg font-extrabold text-[#131827]">{item.name}</h3>
                            {item.description && (
                                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.description}</p>
                            )}
                            {item.stock !== null && item.stock !== undefined && (
                                <p className="mt-3 text-xs font-bold text-slate-500">
                                    Stock: {item.stock.toLocaleString("fr-FR")}
                                </p>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
