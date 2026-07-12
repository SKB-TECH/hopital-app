"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  ClipboardCheck,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { useLogin } from "@/shared/hooks/auth.hooks";
import { tokenStore } from "@/shared/lib/tokenStore";

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
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(29,78,216,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(29,78,216,.05)_1px,transparent_1px)] [background-size:42px_42px]" />

      <section className="relative grid w-full max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)] lg:min-h-[720px] lg:grid-cols-[1.02fr_0.98fr]">
        <div className="relative hidden bg-[#f8fbff] px-10 py-10 lg:flex lg:flex-col">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded bg-white shadow-sm ring-1 ring-slate-200">
              <Image src="/logo.png" alt="Afia-Smart" width={44} height={44} className="h-11 w-11 object-contain" priority />
            </div>
            <div>
              <p className="text-2xl font-black tracking-normal text-blue-700">Afia-Smart</p>
              <p className="mt-1 text-sm font-semibold text-slate-400">Système d’information hospitalier</p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center py-8">
            <MedicalIllustration />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MiniFeature icon={ClipboardCheck} label="Accueil" />
            <MiniFeature icon={Stethoscope} label="Consultation" />
            <MiniFeature icon={HeartPulse} label="Soins" />
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-[430px]">
            <div className="mb-8 flex items-center justify-between lg:justify-end">
              <div className="flex items-center gap-3 lg:hidden">
                <Image src="/logo.png" alt="Afia-Smart" width={40} height={40} className="h-10 w-10 object-contain" priority />
                <span className="text-xl font-black text-blue-700">Afia-Smart</span>
              </div>
              <span className="inline-flex items-center gap-2 rounded border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Sécurisé
              </span>
            </div>

            <div className="mb-7">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Espace personnel</p>
              <h1 className="mt-3 text-4xl font-black leading-tight tracking-normal text-slate-950">{t("title")}</h1>
              <p className="mt-3 text-base font-semibold leading-7 text-slate-500">{t("description")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">{t("email")}</span>
                <div className="flex h-14 items-center gap-3 rounded border border-slate-200 bg-white px-4 transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-50">
                  <Mail className="h-5 w-5 text-slate-300" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className="h-full min-w-0 flex-1 bg-transparent text-base font-bold text-slate-900 outline-none placeholder:text-slate-300"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">{t("password")}</span>
                <div className="flex h-14 items-center gap-3 rounded border border-slate-200 bg-white px-4 transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-50">
                  <LockKeyhole className="h-5 w-5 text-slate-300" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("passwordPlaceholder")}
                    className="h-full min-w-0 flex-1 bg-transparent text-base font-bold text-slate-900 outline-none placeholder:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="text-slate-400 hover:text-slate-700"
                    aria-label="Afficher ou masquer le mot de passe"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between gap-4 text-sm font-bold">
                <label className="flex items-center gap-2 text-slate-500">
                  <input type="checkbox" className="h-4 w-4 accent-blue-600" />
                  {t("remember")}
                </label>
                <a href={`/${locale}/forgot-password`} className="text-blue-600 hover:text-blue-800">
                  {t("forgot")}
                </a>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="flex h-14 w-full items-center justify-center gap-3 rounded bg-blue-600 px-5 text-base font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <ArrowRight className="h-5 w-5" />}
                {isPending ? "Connexion..." : t("submit")}
              </button>
            </form>

            <p className="mt-8 text-center text-xs font-semibold leading-5 text-slate-400">
              © 2026 Afia-Smart. Accès contrôlé, journalisation et traçabilité des données hospitalières.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function MiniFeature({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4 text-center shadow-sm">
      <Icon className="mx-auto h-5 w-5 text-blue-600" />
      <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </div>
  );
}

function MedicalIllustration() {
  return (
    <div className="relative h-[430px] w-full max-w-[430px]">
      <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-50" />
      <div className="absolute left-14 top-28 h-52 w-72 rounded-lg border border-blue-100 bg-white shadow-[0_20px_60px_rgba(37,99,235,0.12)]">
        <div className="flex h-12 items-center gap-2 border-b border-slate-100 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        <div className="grid gap-3 p-5">
          <div className="h-3 w-32 rounded bg-blue-100" />
          <div className="h-3 w-48 rounded bg-slate-100" />
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="h-16 rounded bg-blue-50" />
            <div className="h-16 rounded bg-emerald-50" />
            <div className="h-16 rounded bg-amber-50" />
          </div>
          <div className="mt-2 h-24 rounded border border-slate-100 bg-slate-50 p-4">
            <div className="mb-3 h-2 w-full rounded bg-blue-200" />
            <div className="mb-3 h-2 w-4/5 rounded bg-slate-200" />
            <div className="h-2 w-2/3 rounded bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-24 h-56 w-28">
        <div className="absolute left-9 top-0 h-16 w-16 rounded-full bg-[#1f2937]" />
        <div className="absolute left-12 top-8 h-14 w-12 rounded-full bg-[#f3b39a]" />
        <div className="absolute left-5 top-20 h-32 w-24 rounded-t-[28px] bg-blue-500" />
        <div className="absolute left-7 top-44 h-28 w-8 rounded bg-blue-600" />
        <div className="absolute left-20 top-44 h-28 w-8 rounded bg-blue-600" />
        <div className="absolute left-0 top-28 h-14 w-10 -rotate-12 rounded-full bg-[#f3b39a]" />
        <div className="absolute left-22 top-26 h-16 w-10 rotate-12 rounded-full bg-[#f3b39a]" />
        <div className="absolute left-12 top-36 flex h-14 w-20 -rotate-6 items-center justify-center rounded border border-blue-200 bg-white shadow-sm">
          <HeartPulse className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      <div className="absolute right-12 top-18 flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-white shadow-sm">
        <ShieldCheck className="h-8 w-8 text-blue-600" />
      </div>
      <div className="absolute bottom-12 right-10 flex h-20 w-20 items-center justify-center rounded-lg border border-emerald-100 bg-white shadow-sm">
        <Stethoscope className="h-10 w-10 text-emerald-600" />
      </div>
    </div>
  );
}
