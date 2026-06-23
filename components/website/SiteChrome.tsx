import {
  Globe2,
  Menu,
  MessageCircle,
  Share2,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { LocalizedLink } from "./LocalizedLink";
import { BrandLogo } from "./BrandLogo";
import { LanguageToggle } from "./LanguageToggle";

type NavTone = "light" | "transparent";

export function WebsiteNav({
  active = "Discover",
  tone = "light",
}: {
  active?: string;
  tone?: NavTone;
}) {
  const transparent = tone === "transparent";
  const t = useTranslations("navigation");
  const navItems = [
    [t("home"), "/"],
    [t("events"), "/discover"],
    [t("marketplace"), "/marketplace"],
    [t("buses"), "/buses"],
    [t("flights"), "/flights"],
    [t("vouchers"), "/vouchers"],
    [t("stay"), "/stay"],
  ];

  return (
    <header
      className={`z-50 w-full border-b ${
        transparent
          ? "absolute left-0 top-0 border-white/10 bg-transparent text-white"
          : "sticky top-0 border-slate-200 bg-white/95 text-slate-900 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-10">
        <LocalizedLink href="/">
          <BrandLogo tone={transparent ? "light" : "dark"} size="sm" />
        </LocalizedLink>

        <nav className="hidden items-center gap-5 text-sm font-bold md:flex">
          {navItems.map(([label, href]) => (
            <LocalizedLink
              key={href}
              href={href}
              className={`pb-2 ${
                active === label
                  ? "border-b-2 border-[#005995] text-[#005995]"
                  : transparent
                    ? "text-white/90"
                    : "text-slate-700"
              }`}
          >
              {label}
            </LocalizedLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LocalizedLink
            href="/auth?mode=login"
            className={`hidden rounded-lg px-5 py-3 text-sm font-bold md:inline-flex ${
              transparent
                ? "border border-white/30 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {t("login")}
          </LocalizedLink>
          <LocalizedLink
            href="/auth?mode=register"
            className="rounded-lg bg-[#005995] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#004b7d]"
          >
            {t("signup")}
          </LocalizedLink>
          <LanguageToggle tone={transparent ? "light" : "dark"} />
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 md:hidden">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export function WebsiteFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-[1.3fr_1fr_1fr_1fr] md:px-10">
        <div>
          <BrandLogo />
          <p className="mt-5 max-w-xs text-lg leading-8 text-slate-600">
            {t("description")}
          </p>
          <div className="mt-7 flex gap-3 text-slate-500">
            <Globe2 className="h-5 w-5" />
            <Users className="h-5 w-5" />
            <Share2 className="h-5 w-5" />
          </div>
        </div>
        <FooterColumn
          title={t("company.title")}
          links={[
            [t("company.about"), "/about"],
            [t("company.careers"), "/careers"],
            [t("company.contact"), "/contact"],
          ]}
        />
        <FooterColumn
          title={t("explore.title")}
          links={[
            [t("explore.events"), "/discover"],
            [t("explore.marketplace"), "/marketplace"],
            [t("explore.buses"), "/buses"],
            [t("explore.flights"), "/flights"],
            [t("explore.vouchers"), "/vouchers"],
            [t("explore.stay"), "/stay"],
            [t("explore.organizers"), "/organizers/vanguard-productions"],
            [t("explore.cities"), "/city/london"],
          ]}
        />
        <FooterColumn
          title={t("resources.title")}
          links={[
            [t("resources.terms"), "/terms"],
            [t("resources.privacy"), "/privacy"],
            [t("resources.help"), "/help"],
          ]}
        />
      </div>
      <div className="border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-500">
        {t("copyright")}
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#005995]">
        {title}
      </h3>
      <ul className="mt-6 space-y-4">
        {links.map(([label, href]) => (
          <li key={href}>
            <LocalizedLink href={href} className="text-slate-600 underline-offset-4 hover:underline">
              {label}
            </LocalizedLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SocialButtons() {
  return (
    <div className="flex justify-center gap-4">
      {[Globe2, MessageCircle, Share2].map((Icon, index) => (
        <button
          key={index}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#005995]"
        >
          <Icon className="h-5 w-5" />
        </button>
      ))}
    </div>
  );
}
