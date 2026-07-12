"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Eye,
  EyeOff,
  FileText,
  HeartPulse,
  Monitor,
  Printer,
  ShieldCheck,
  Stethoscope,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { useLogin } from "@/shared/hooks/auth.hooks";
import { tokenStore } from "@/shared/lib/tokenStore";

const quickLinks = [
  { label: "Guichet tickets", href: "ticket-kiosk", icon: Printer, tone: "bg-blue-700 text-white" },
  { label: "Appel patients", href: "doctor/waiting-room", icon: TicketCheck, tone: "bg-slate-950 text-white" },
  { label: "Écran attente", href: "waiting-room/display", icon: Monitor, tone: "bg-white text-slate-900" },
];

const metrics = [
  { label: "Réception", value: "Tickets", detail: "Accueil et orientation", icon: UsersRound },
  { label: "Consultation", value: "DPI", detail: "Dossier patient clinique", icon: Stethoscope },
  { label: "Facturation", value: "Caisse", detail: "Paiements et reçus", icon: FileText },
  { label: "Pilotage", value: "Temps réel", detail: "Files et tableaux de bord", icon: HeartPulse },
];

const workflow = [
  "Identifier le patient",
  "Créer ou imprimer le ticket",
  "Appeler depuis le service",
  "Clôturer le passage",
];

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const router = useRouter();
  const overviewPath = `/${locale}/overview`;

  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const { mutate, isPending } = useLogin();

  useEffect(() => {
    if (tokenStore.get()) router.replace(overviewPath);
  }, [router, overviewPath]);

  const canSubmit = identifier.trim() && password.trim() && !isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!identifier.trim()) {
      toast.warning("Champ obligatoire", { description: "Veuillez saisir votre email ou téléphone." });
      return;
    }
    if (!password.trim()) {
      toast.warning("Champ obligatoire", { description: "Veuillez saisir votre mot de passe." });
      return;
    }

    mutate(
      { email: identifier.trim(), password },
      {
        onSuccess: () => {
          toast.success("Connexion réussie", { description: "Redirection vers votre espace..." });
          router.replace(overviewPath);
        },
        onError: (error: any) => {
          const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Une erreur est survenue. Veuillez réessayer.";
          toast.error("Connexion échouée", { description: Array.isArray(message) ? message.join(", ") : message });
        },
      },
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center border border-slate-200 bg-white shadow-sm">
              <Image src="/logo.png" alt="Afia-Smart" width={44} height={44} className="h-11 w-11 object-contain" priority />
            </div>
            <div>
              <p className="text-2xl font-black tracking-normal text-slate-950">Afia-Smart</p>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Système d’information hospitalier</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickLinks.map(({ label, href, icon: Icon, tone }) => (
              <a key={href} href={`/${locale}/${href}`} className={`inline-flex h-11 items-center gap-2 border border-slate-200 px-4 text-sm font-black shadow-sm transition hover:-translate-y-0.5 ${tone}`}>
                <Icon className="h-4 w-4" />
                {label}
              </a>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:py-12">
        <div className="order-2 space-y-6 lg:order-1">
          <div className="border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[1fr_300px]">
              <div className="p-6 sm:p-8">
                <div className="mb-5 inline-flex items-center gap-2 border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                  <ShieldCheck className="h-4 w-4" />
                  Portail sécurisé
                </div>
                <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
                  Entrée unique pour l’accueil, les soins et la caisse.
                </h1>
                <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-slate-600">
                  La réception lance les tickets, les praticiens appellent les patients par service, et chaque passage reste traçable dans le dossier.
                </p>
              </div>

              <div className="border-t border-slate-200 bg-slate-950 p-6 text-white lg:border-l lg:border-t-0">
                <div className="flex items-center gap-3">
                  <Building2 className="h-7 w-7 text-blue-300" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-200">Session hôpital</p>
                    <p className="text-xl font-black">Exploitation du jour</p>
                  </div>
                </div>
                <div className="mt-7 grid gap-3">
                  {workflow.map((item, index) => (
                    <div key={item} className="flex items-center gap-3 border border-white/10 bg-white/[0.05] px-4 py-3">
                      <span className="flex h-7 w-7 items-center justify-center bg-blue-600 text-xs font-black">{index + 1}</span>
                      <span className="text-sm font-bold text-slate-200">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, detail, icon: Icon }) => (
              <div key={label} className="border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex h-11 w-11 items-center justify-center bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{detail}</p>
              </div>
            ))}
          </div>

          <div className="border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">Accès rapide réception</p>
                <p className="mt-1 text-lg font-black text-slate-950">À lancer chaque matin au guichet</p>
              </div>
              <a href={`/${locale}/ticket-kiosk`} className="inline-flex h-12 items-center justify-center gap-2 bg-blue-700 px-5 text-sm font-black text-white hover:bg-blue-800">
                <Printer className="h-4 w-4" />
                Ouvrir le guichet tickets
              </a>
            </div>
          </div>
        </div>

        <aside className="order-1 lg:order-2">
          <div className="sticky top-6 border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="mb-7">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Connexion personnel</p>
              <h2 className="mt-3 text-3xl font-black tracking-normal text-slate-950">{t("title")}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{t("description")}</p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase text-slate-500">{t("email")}</span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="h-14 border border-slate-300 bg-white px-4 text-base font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-50"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase text-slate-500">{t("password")}</span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("passwordPlaceholder")}
                    className="h-14 w-full border border-slate-300 bg-white px-4 pr-12 text-base font-bold outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                    aria-label="Afficher ou masquer le mot de passe"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between gap-4 text-sm font-bold">
                <label className="flex items-center gap-2 text-slate-500">
                  <input type="checkbox" className="h-4 w-4 accent-blue-700" />
                  {t("remember")}
                </label>
                <a href={`/${locale}/forgot-password`} className="text-blue-700 hover:text-blue-900">
                  {t("forgot")}
                </a>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="flex h-14 items-center justify-center gap-3 bg-blue-700 px-5 text-base font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <ArrowRight className="h-5 w-5" />}
                {isPending ? "Connexion..." : t("submit")}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                <CalendarDays className="h-4 w-4 text-blue-700" />
                Accès contrôlé, actions auditées et traçabilité clinique.
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
