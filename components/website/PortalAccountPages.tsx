"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Calendar, Download, LogOut, MapPin, QrCode, Ticket, User } from "lucide-react";
import { toast } from "sonner";
import { WebsiteFooter, WebsiteNav } from "@/components/website/SiteChrome";
import { LocalizedLink } from "@/components/website/LocalizedLink";
import { portalService, type PortalTicket } from "@/shared/services/portal.service";
import type { AuthUser } from "@/shared/types/auth.types";
import { websiteImages } from "@/components/website/website-data";

function formatDate(value?: string) {
    if (!value) return "Date à confirmer";
    return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function getEventLocation(ticket: PortalTicket) {
    const venue = ticket.event?.venue;
    return [venue?.name, venue?.city, venue?.country].filter(Boolean).join(", ") || "Lieu à confirmer";
}

export function PortalProfilePage() {
    const router = useRouter();
    const locale = useLocale();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        portalService
            .me()
            .then(setUser)
            .catch(() => {
                toast.error("Veuillez vous connecter pour accéder à votre profil.");
                router.push(`/${locale}/auth?mode=login`);
            })
            .finally(() => setIsLoading(false));
    }, [locale, router]);

    return (
        <main className="bg-[#F5F7FC]">
            <WebsiteNav />
            <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[280px_1fr] md:px-10">
                <PortalAccountSidebar user={user} active="Profile" />
                <div className="rounded-xl border bg-white p-10 shadow-sm">
                    <h1 className="text-4xl font-extrabold">Personal Information</h1>
                    <p className="mt-3 text-xl text-slate-600">Manage your profile details and preferences.</p>
                    <div className="mt-8 border-t pt-8">
                        {isLoading ? (
                            <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
                        ) : (
                            <>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <ReadOnlyField label="Full Name" value={user?.fullName || "-"} />
                                    <ReadOnlyField label="Status" value={user?.status || "ACTIVE"} />
                                </div>
                                <ReadOnlyField label="Email Address" value={user?.email || "-"} className="mt-6" />
                                <div className="mt-6 grid gap-6 md:grid-cols-2">
                                    <ReadOnlyField label="Phone Number" value={user?.phone || "-"} />
                                    <ReadOnlyField label="Member Since" value={user?.createdAt ? formatDate(user.createdAt) : "-"} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>
            <WebsiteFooter />
        </main>
    );
}

export function PortalTicketsPage() {
    const router = useRouter();
    const locale = useLocale();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [tickets, setTickets] = useState<PortalTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        Promise.all([portalService.me(), portalService.tickets({ limit: 50 })])
            .then(([profile, ticketResponse]) => {
                setUser(profile);
                setTickets(ticketResponse.data || []);
            })
            .catch(() => {
                toast.error("Veuillez vous connecter pour voir vos tickets.");
                router.push(`/${locale}/auth?mode=login`);
            })
            .finally(() => setIsLoading(false));
    }, [locale, router]);

    const upcomingTickets = useMemo(
        () => tickets.filter((ticket) => !ticket.event?.startAt || new Date(ticket.event.startAt).getTime() >= Date.now()),
        [tickets]
    );
    const pastTickets = useMemo(
        () => tickets.filter((ticket) => ticket.event?.startAt && new Date(ticket.event.startAt).getTime() < Date.now()),
        [tickets]
    );

    return (
        <main className="bg-[#F5F7FC]">
            <WebsiteNav />
            <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[280px_1fr] md:px-10">
                <PortalAccountSidebar user={user} active="My Tickets" />
                <div>
                    <h1 className="text-4xl font-extrabold">My Tickets</h1>
                    <p className="mt-3 text-xl text-slate-600">View and manage all your upcoming and past event experiences.</p>
                    <div className="mt-8 flex gap-8 border-b">
                        <button className="border-b-2 border-[#005995] pb-4 font-extrabold text-[#005995]">
                            Upcoming Tickets ({upcomingTickets.length})
                        </button>
                        <button className="pb-4 font-bold text-slate-500">Past Tickets ({pastTickets.length})</button>
                    </div>
                    <div className="mt-8 space-y-8">
                        {isLoading && <div className="h-64 animate-pulse rounded-xl bg-white" />}
                        {!isLoading && upcomingTickets.length === 0 && (
                            <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
                                <Ticket className="mx-auto h-12 w-12 text-slate-300" />
                                <h2 className="mt-4 text-2xl font-extrabold">Aucun ticket pour le moment</h2>
                                <p className="mt-2 text-slate-600">Vos billets achetés apparaîtront ici automatiquement.</p>
                                <LocalizedLink href="/discover" className="mt-6 inline-flex rounded-lg bg-[#005995] px-6 py-3 font-bold text-white">
                                    Découvrir les événements
                                </LocalizedLink>
                            </div>
                        )}
                        {upcomingTickets.map((ticket) => (
                            <PortalTicketCard key={ticket.id} ticket={ticket} />
                        ))}
                    </div>
                </div>
            </section>
            <WebsiteFooter />
        </main>
    );
}

function PortalAccountSidebar({ user, active }: { user: AuthUser | null; active: "Profile" | "My Tickets" }) {
    const router = useRouter();
    const locale = useLocale();

    const logout = () => {
        portalService.logout();
        router.push(`/${locale}/auth?mode=login`);
    };

    return (
        <aside className="h-fit rounded-xl border bg-white p-8 shadow-sm">
            <div className="text-center">
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full bg-slate-200">
                    <Image src={user?.avatarUrl || websiteImages.portrait} alt={user?.fullName || "User"} fill className="object-cover" />
                </div>
                <h2 className="mt-5 text-2xl font-extrabold">{user?.fullName || "Votre compte"}</h2>
                <p className="break-all text-sm text-slate-500">{user?.email || ""}</p>
            </div>
            <nav className="mt-8 border-t pt-6">
                <LocalizedLink href="/account/profile" className={`mb-2 flex items-center gap-3 rounded-lg px-4 py-4 font-bold ${active === "Profile" ? "bg-[#D9EAFE] text-[#005995]" : "text-slate-600"}`}>
                    <User className="h-5 w-5" />
                    Profile
                </LocalizedLink>
                <LocalizedLink href="/account/tickets" className={`mb-2 flex items-center gap-3 rounded-lg px-4 py-4 font-bold ${active === "My Tickets" ? "bg-[#D9EAFE] text-[#005995]" : "text-slate-600"}`}>
                    <Ticket className="h-5 w-5" />
                    My Tickets
                </LocalizedLink>
                <button onClick={logout} className="mt-4 flex w-full items-center gap-3 rounded-lg px-4 py-4 font-bold text-red-600 hover:bg-red-50">
                    <LogOut className="h-5 w-5" />
                    Log Out
                </button>
            </nav>
        </aside>
    );
}

function PortalTicketCard({ ticket }: { ticket: PortalTicket }) {
    const event = ticket.event;
    const title = event?.title || "Ticket";
    const image = event?.bannerUrl || websiteImages.stage;
    const category = event?.category?.name || ticket.ticketType?.name || "Event";

    return (
        <article className="grid overflow-hidden rounded-xl border bg-white shadow-sm lg:grid-cols-[360px_1fr]">
            <div className="relative min-h-64 bg-slate-200">
                <Image src={image} alt={title} fill className="object-cover" />
            </div>
            <div className="p-8">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#D9EAFE] px-4 py-2 text-sm font-extrabold uppercase text-[#005995]">{category}</span>
                    <span className="font-bold text-slate-600">• {ticket.status || "Confirmed"}</span>
                </div>
                <h2 className="mt-4 text-3xl font-extrabold text-[#131827]">{title}</h2>
                <p className="mt-4 flex items-center gap-2 text-lg text-slate-600">
                    <Calendar className="h-5 w-5" />
                    {formatDate(event?.startAt)}
                </p>
                <p className="mt-2 flex items-center gap-2 text-lg text-slate-600">
                    <MapPin className="h-5 w-5" />
                    {getEventLocation(ticket)}
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                    <button className="inline-flex items-center gap-2 rounded-lg bg-[#005995] px-6 py-3 font-bold text-white">
                        <Download className="h-5 w-5" />
                        Download PDF
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 font-bold text-slate-700">
                        <QrCode className="h-5 w-5" />
                        View QR Code
                    </button>
                    {event?.slug && (
                        <LocalizedLink href={`/events/${event.slug}`} className="ml-auto inline-flex items-center px-2 py-3 font-extrabold text-[#005995]">
                            Event Details
                        </LocalizedLink>
                    )}
                </div>
            </div>
        </article>
    );
}

function ReadOnlyField({ label, value, className = "" }: { label: string; value: string; className?: string }) {
    return (
        <label className={`block ${className}`}>
            <span className="font-bold text-slate-700">{label}</span>
            <input className="mt-3 w-full rounded-lg bg-[#F0F3F9] px-5 py-4 outline-none" value={value} readOnly />
        </label>
    );
}
