import Image from "next/image";
import {
  ChevronDown,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Search,
  Ticket,
  User,
} from "lucide-react";
import { WebsiteFooter, WebsiteNav } from "./SiteChrome";
import { LocalizedLink } from "./LocalizedLink";
import { BrandLogo } from "./BrandLogo";
import CheckoutSeatSelector from "./CheckoutSeatSelector";
import { faqs, websiteImages } from "./website-data";
import type { PublicEvent } from "@/shared/types/public-event.types";

export function AboutPage() {
  return (
    <main className="bg-[#F5F7FC]">
      <WebsiteNav active="Help" />
      <section className="mx-auto max-w-7xl px-6 py-24 md:px-10">
        <p className="text-sm font-extrabold uppercase tracking-widest text-[#005995]">Our purpose</p>
        <h1 className="mt-8 max-w-5xl text-5xl font-extrabold leading-tight text-slate-950 md:text-7xl">
          We build bridges between <span className="text-[#005995]">human connection</span> and live experiences.
        </h1>
        <p className="mt-8 max-w-4xl text-xl leading-9 text-slate-600">
          Kongo Event helps people discover, book, and manage real events published by organizers on the platform.
        </p>
      </section>
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-3 md:px-10">
          <h2 className="text-4xl font-extrabold text-slate-950">A marketplace for verified live experiences.</h2>
          <p className="text-lg leading-8 text-slate-600">
            Public pages are powered by event, category, venue, ticket, and organizer records from the API.
          </p>
          <p className="text-lg leading-8 text-slate-600">
            Checkout and account pages use the portal endpoints so attendees see only their own tickets and orders.
          </p>
        </div>
      </section>
      <WebsiteFooter />
    </main>
  );
}

export function ContactPage() {
  return (
    <main className="bg-[#F5F7FC]">
      <WebsiteNav active="Help" />
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="rounded-2xl bg-[#0872B8] px-10 py-24 text-white md:px-24">
          <h1 className="max-w-4xl text-5xl font-extrabold leading-tight md:text-7xl">Get in Touch with Our Team</h1>
          <p className="mt-8 max-w-3xl text-xl leading-9 text-white/80">
            Have questions about an event or need technical support? Send a message to the support team.
          </p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <form className="rounded-xl border bg-white p-10 shadow-sm">
            <h2 className="text-4xl font-extrabold">Send us a message</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <Field label="Full Name" placeholder="Votre nom" />
              <Field label="Email Address" placeholder="email@domain.com" />
            </div>
            <Field label="Subject" placeholder="Sujet" className="mt-6" />
            <label className="mt-6 block">
              <span className="font-bold text-slate-700">Message</span>
              <textarea className="mt-3 min-h-40 w-full rounded-lg bg-[#F0F3F9] p-5 outline-none" placeholder="Votre message" />
            </label>
            <button className="mt-8 rounded-lg bg-[#005995] px-8 py-4 font-extrabold text-white">Send Message</button>
          </form>
          <div className="space-y-8">
            <div className="rounded-xl bg-slate-200 p-10">
              <h2 className="text-3xl font-extrabold">Support</h2>
              <InfoLine icon={MapPin} title="Location" text="Congo - Kinshasa" />
              <InfoLine icon={Phone} title="Phone" text="Contact support" />
              <InfoLine icon={Mail} title="Email" text="support@kongoevent.com" />
            </div>
            <div className="relative h-80 overflow-hidden rounded-xl bg-slate-900">
              <Image src={websiteImages.map} alt="Support map" fill className="object-cover opacity-70" />
            </div>
          </div>
        </div>
      </section>
      <FaqCompact />
      <WebsiteFooter />
    </main>
  );
}

export function HelpPage() {
  return (
    <main className="bg-[#F5F7FC]">
      <WebsiteNav active="Help" />
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="rounded-2xl bg-[#0872B8] px-10 py-24 text-white md:px-24">
          <h1 className="text-6xl font-extrabold">Help Center</h1>
          <p className="mt-6 max-w-3xl text-xl text-white/80">
            Find answers to common questions about ticketing, hosting events, and managing your account at Kongo Event.
          </p>
          <div className="mt-10 flex max-w-xl items-center gap-4 rounded-full bg-white px-6 py-4 text-slate-600">
            <Search className="h-6 w-6" />
            <input className="w-full bg-transparent outline-none" placeholder="Search for questions..." />
          </div>
        </div>
        <div className="mt-16 grid gap-10 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-3">
            <p className="mb-5 text-sm font-extrabold uppercase tracking-widest text-slate-500">Categories</p>
            {faqs.map((group, index) => (
              <a key={group.title} className={`flex items-center gap-3 rounded-lg px-5 py-4 font-bold ${index === 0 ? "bg-[#D9EAFE] text-[#005995]" : "text-slate-600"}`}>
                <group.icon className="h-5 w-5" />
                {group.title}
              </a>
            ))}
          </aside>
          <div className="space-y-14">
            {faqs.map((group) => (
              <section key={group.title}>
                <div className="mb-6 flex items-center gap-5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#27B7F5] text-white">
                    <group.icon className="h-6 w-6" />
                  </span>
                  <h2 className="text-4xl font-extrabold">{group.title}</h2>
                </div>
                <div className="space-y-4">
                  {group.questions.map((question) => <FaqItem key={question} question={question} />)}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-24 md:px-10">
        <div className="rounded-2xl border border-[#C7DFFF] p-16 text-center">
          <h2 className="text-4xl font-extrabold">Still need help?</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-600">Our support team is available to assist with specific queries.</p>
          <div className="mt-8 flex justify-center gap-4">
            <LocalizedLink href="/contact" className="rounded-lg bg-[#005995] px-8 py-4 font-extrabold text-white">Contact Support</LocalizedLink>
          </div>
        </div>
      </section>
      <WebsiteFooter />
    </main>
  );
}

export function CheckoutPage({ event }: { event?: PublicEvent | null } = {}) {
  if (!event) {
    return (
      <main className="bg-[#F5F7FC]">
        <CheckoutHeader cancelHref="/discover" />
        <section className="mx-auto max-w-3xl px-6 py-20 text-center md:px-10">
          <div className="rounded-xl border bg-white p-10 shadow-sm">
            <h1 className="text-3xl font-extrabold text-[#131827]">Événement introuvable</h1>
            <p className="mt-4 text-slate-600">Le checkout doit recevoir un événement réel depuis l'API.</p>
            <LocalizedLink href="/discover" className="mt-8 inline-flex rounded-lg bg-[#005995] px-6 py-3 font-bold text-white">
              Retour aux événements
            </LocalizedLink>
          </div>
        </section>
        <WebsiteFooter />
      </main>
    );
  }

  const eventCapacity = event.capacity || event.ticketTypes?.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0) || 0;
  const checkoutTickets = event.ticketTypes ?? [];
  const minCurrency = checkoutTickets[0]?.currency || event.currency || "USD";

  return (
    <main className="bg-[#F5F7FC]">
      <CheckoutHeader cancelHref={`/events/${event.slug}`} />
      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px] md:px-10">
        <div className="space-y-8">
          <CheckoutPanel title="Attendee Information" icon={User}>
            <div className="space-y-6">
              {checkoutTickets.map((ticket, index) => (
                <div key={ticket.id} className="rounded-lg border p-6">
                  <p className="mb-6 font-extrabold uppercase tracking-widest text-slate-500">Ticket {index + 1}: {ticket.name}</p>
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="First Name" placeholder="Prénom" />
                    <Field label="Last Name" placeholder="Nom" />
                  </div>
                  {index === 0 && <Field label="Email Address" placeholder="email@domain.com" className="mt-5" />}
                </div>
              ))}
            </div>
          </CheckoutPanel>
          <CheckoutPanel title="Select your Seat" icon={Ticket}>
            <CheckoutSeatSelector capacity={eventCapacity} ticketTypes={event.ticketTypes} />
          </CheckoutPanel>
          <CheckoutPanel title="Payment Method" icon={CreditCard}>
            <div className="grid gap-4 md:grid-cols-2">
              <button className="rounded-lg border-2 border-[#005995] bg-[#F2FAFF] p-6 font-extrabold text-[#005995]">Credit Card</button>
              <button className="rounded-lg border p-6 font-extrabold text-slate-400">Mobile Money</button>
            </div>
            <Field label="Card Number" placeholder="0000 0000 0000 0000" className="mt-6" />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Expiry Date" placeholder="MM / YY" />
              <Field label="CVC" placeholder="123" />
            </div>
          </CheckoutPanel>
        </div>
        <aside className="h-fit rounded-xl border bg-white shadow-sm">
          <div className="relative h-48 overflow-hidden rounded-t-xl">
            <Image src={event.bannerUrl || websiteImages.hero} alt={event.title} fill className="object-cover" />
          </div>
          <div className="space-y-4 p-6">
            <h2 className="text-xl font-extrabold text-[#131827]">{event.title}</h2>
            <SummaryRow label="Capacité" value={`${eventCapacity.toLocaleString("fr-FR")} places`} />
            {checkoutTickets.map((ticket) => (
              <SummaryRow
                key={ticket.id}
                label={`${ticket.name} • ${ticket.quantity.toLocaleString("fr-FR")} billets`}
                value={`${ticket.price.toLocaleString("fr-FR")} ${ticket.currency}`}
              />
            ))}
            <SummaryRow label="Prix minimum" value={`${(event.minPrice || 0).toLocaleString("fr-FR")} ${minCurrency}`} />
            <div className="flex gap-2 border-t pt-5">
              <input className="min-w-0 flex-1 rounded-lg bg-[#F0F3F9] px-4 py-3 outline-none" placeholder="Promo Code" />
              <button className="rounded-lg bg-[#0872B8] px-4 font-extrabold text-white">Apply</button>
            </div>
            <SummaryRow label="Total" value="Selon votre sélection" strong />
            <LocalizedLink href="/order-success" className="block rounded-lg bg-[#005995] py-4 text-center font-extrabold text-white">Complete Purchase</LocalizedLink>
            <p className="text-center text-xs font-bold text-slate-500">Encrypted & Secure Payment</p>
          </div>
        </aside>
      </section>
      <WebsiteFooter />
    </main>
  );
}

export function LegalPage({ type }: { type: "privacy" | "terms" }) {
  const privacy = type === "privacy";
  return (
    <main className="bg-[#F5F7FC]">
      <WebsiteNav />
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <h1 className="text-6xl font-extrabold text-[#005995]">{privacy ? "Privacy Policy" : "Terms of Service"}</h1>
        <p className="mt-6 max-w-3xl text-xl text-slate-600">Please read this information carefully before using Kongo Event.</p>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[260px_1fr] md:px-10">
        <aside className="hidden space-y-3 lg:block">
          {["Introduction", "User Accounts", "Ticket Sales", "Security", "Liability & Legal"].map((item, index) => (
            <a key={item} className={`block rounded-lg px-5 py-4 font-bold ${index === 0 ? "bg-[#D9EAFE] text-[#005995]" : "text-slate-600"}`}>{item}</a>
          ))}
        </aside>
        <article className="rounded-xl border bg-white p-10 shadow-sm">
          {(privacy
            ? ["Data Collection", "How We Use Your Information", "Cookies and Tracking", "Third-Party Sharing", "User Rights", "Security Measures"]
            : ["Introduction", "User Accounts", "Ticket Sales & Payments", "Prohibited Conduct", "Liability & Legal"]
          ).map((title, index) => (
            <section key={title} className="border-b py-8 last:border-b-0">
              <h2 className="text-3xl font-extrabold">{index + 1}. {title}</h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Kongo Event provides a secure marketplace for discovering, booking, and managing live experiences.
              </p>
            </section>
          ))}
        </article>
      </section>
      <WebsiteFooter />
    </main>
  );
}

function CheckoutHeader({ cancelHref }: { cancelHref: string }) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-10">
        <LocalizedLink href="/">
          <BrandLogo />
        </LocalizedLink>
        <p className="font-bold text-slate-500">Secure Checkout</p>
        <LocalizedLink href={cancelHref} className="font-bold text-slate-600">Cancel</LocalizedLink>
      </div>
    </header>
  );
}

function FaqCompact() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20 text-center">
      <h2 className="text-4xl font-extrabold">Frequently Asked Questions</h2>
      <p className="mt-4 text-slate-600">Quick answers to questions you might have.</p>
      <div className="mt-10 space-y-4 text-left">
        {["How do I purchase tickets for an event?", "What is the refund policy?", "How can I host my own event?", "Is my payment information secure?"].map((question) => (
          <FaqItem key={question} question={question} />
        ))}
      </div>
    </section>
  );
}

function FaqItem({ question }: { question: string }) {
  return (
    <button className="flex w-full items-center justify-between rounded-xl border bg-white p-6 text-left text-xl font-extrabold">
      {question}
      <ChevronDown className="h-5 w-5 text-[#005995]" />
    </button>
  );
}

function Field({ label, placeholder, className = "" }: { label: string; placeholder: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="font-bold text-slate-700">{label}</span>
      <input className="mt-3 w-full rounded-lg bg-[#F0F3F9] px-5 py-4 outline-none" placeholder={placeholder} />
    </label>
  );
}

function InfoLine({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="mt-8 flex gap-5">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D8EAF8] text-[#005995]"><Icon className="h-5 w-5" /></span>
      <p><strong>{title}</strong><br />{text}</p>
    </div>
  );
}

function CheckoutPanel({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-8 shadow-sm">
      <h2 className="mb-8 flex items-center gap-4 text-3xl font-extrabold"><Icon className="h-7 w-7 text-[#005995]" />{title}</h2>
      {children}
    </section>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-3xl font-extrabold" : "text-lg font-bold"}`}>
      <span>{label}</span>
      <span className={strong ? "text-[#005995]" : ""}>{value}</span>
    </div>
  );
}
