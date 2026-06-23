"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

type Tone = "light" | "dark";

export function LanguageToggle({ tone = "dark" }: { tone?: Tone }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale = locale === "fr" ? "en" : "fr";
  const isLight = tone === "light";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-extrabold transition ${
        isLight
          ? "border-white/30 text-white hover:bg-white/10"
          : "border-slate-200 text-slate-700 hover:bg-slate-100"
      }`}
      aria-label={nextLocale === "fr" ? "Passer en français" : "Switch to English"}
    >
      <Languages className="h-4 w-4" />
      {nextLocale.toUpperCase()}
    </button>
  );
}
