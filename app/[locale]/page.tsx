"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BedDouble, CalendarClock, ChevronDown, Cross, FileText, HeartPulse, type LucideIcon, Pill, ReceiptText, Stethoscope } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function HomePage() {
  const locale = useLocale();
  const reduceMotion = useReducedMotion();

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-[#061A4D]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,26,77,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(6,26,77,0.045)_1px,transparent_1px)] bg-[size:80px_80px]" />

      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] overflow-hidden md:block" aria-hidden>
        <motion.div
          initial={{ x: 90, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -top-20 left-[9%] h-[120%] w-[44%] -skew-x-[10deg] bg-[#eef3fb]"
        />
        <motion.div
          initial={{ x: 120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.05, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -top-24 left-[50%] h-[125%] w-[42%] -skew-x-[10deg] bg-[#d9ecfb]"
        />
        <motion.div
          initial={{ x: 150, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.15, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -top-24 left-[78%] h-[125%] w-[36%] -skew-x-[10deg] bg-[#c5e5f9]"
        />
        <div className="absolute right-[13%] top-[18%] h-20 w-20 text-[#0B43B5]/10">
          <Cross className="h-full w-full" strokeWidth={1.4} />
        </div>
        <div className="absolute bottom-[14%] left-[30%] h-14 w-14 text-[#0B43B5]/10">
          <HeartPulse className="h-full w-full" strokeWidth={1.4} />
        </div>
      </div>

      <header className="relative z-20 mx-auto flex max-w-[1380px] items-center justify-between px-6 py-5 sm:px-10 lg:px-12">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <Image src="/logo.png" alt="Doclyn" width={52} height={52} className="h-12 w-12 object-contain" priority />
          <span className="text-2xl font-black text-[#0B43B5]">Doclyn</span>
        </Link>

        <button className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[#061A4D] shadow-[0_10px_30px_rgba(6,26,77,0.08)] ring-1 ring-slate-100">
          <span className="text-xl">{locale === "en" ? "🇺🇸" : "🇫🇷"}</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] max-w-[1380px] items-center gap-4 px-6 pb-8 pt-2 sm:px-10 md:grid-cols-[0.92fr_1.08fr] lg:px-12">
        <div className="max-w-3xl py-6 lg:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 inline-flex items-center gap-3 border border-[#D7E7FB] bg-white/80 px-4 py-3 text-sm font-black text-[#0B43B5] shadow-[0_14px_38px_rgba(6,26,77,0.06)]"
          >
            <HeartPulse className="h-5 w-5" />
            SIH clinique et administratif
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="text-[4rem] font-black leading-[0.98] tracking-normal text-[#061A4D] sm:text-[4.6rem] lg:text-[5.7rem] xl:text-[6.35rem]"
          >
            Doclyn
            <br />
            Hospital
            <br />
            Portal
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 max-w-xl text-lg font-medium leading-8 text-slate-600 lg:text-xl lg:leading-9"
          >
            Gérez l’accueil, les dossiers patients, les soins, la pharmacie et la facturation depuis un espace hospitalier simple, rapide et sécurisé.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8"
          >
            <Link
              href={`/${locale}/login`}
              prefetch={false}
              className="inline-flex h-16 items-center justify-center gap-10 bg-[#0B43B5] px-8 text-base font-black text-white shadow-[0_24px_60px_rgba(11,67,181,0.18)] transition hover:-translate-y-0.5 hover:bg-[#08358f]"
            >
              Entrer dans mon espace
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>

        <div className="relative hidden min-h-[500px] items-center justify-center md:flex lg:min-h-[620px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.85, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex h-[390px] w-[390px] items-center justify-center lg:h-[500px] lg:w-[500px]"
          >
            <Orbit className="h-[380px] w-[380px] border-[#0B43B5]/15 lg:h-[490px] lg:w-[490px]" />
            <Orbit className="h-[300px] w-[300px] border-[#0B43B5]/18 lg:h-[390px] lg:w-[390px]" />
            <Orbit className="h-[220px] w-[220px] border-[#0B43B5]/20 lg:h-[290px] lg:w-[290px]" />

            <motion.span
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
              className="absolute h-[380px] w-[380px] lg:h-[490px] lg:w-[490px]"
            >
              <span className="absolute left-[10%] top-[69%] h-3.5 w-3.5 rounded-full bg-[#04A9F4] shadow-[0_0_0_10px_rgba(4,169,244,0.1)]" />
            </motion.span>
            <motion.span
              animate={reduceMotion ? undefined : { rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute h-[300px] w-[300px] lg:h-[390px] lg:w-[390px]"
            >
              <span className="absolute right-[11%] top-[28%] h-3.5 w-3.5 rounded-full bg-[#04A9F4] shadow-[0_0_0_10px_rgba(4,169,244,0.1)]" />
            </motion.span>
            <motion.span
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute h-[220px] w-[220px] lg:h-[290px] lg:w-[290px]"
            >
              <span className="absolute right-[19%] top-[2%] h-3 w-3 rounded-full bg-[#04A9F4] shadow-[0_0_0_8px_rgba(4,169,244,0.1)]" />
            </motion.span>

            <FloatingIcon icon={CalendarClock} label="Accueil" className="left-0 top-20 lg:left-3 lg:top-24" delay={0.1} />
            <FloatingIcon icon={Stethoscope} label="Consultation" className="right-0 top-24 lg:right-6 lg:top-28" delay={0.2} />
            <FloatingIcon icon={BedDouble} label="Lits" className="left-8 bottom-24 lg:left-14 lg:bottom-28" delay={0.3} />
            <FloatingIcon icon={Pill} label="Pharmacie" className="right-8 bottom-16 lg:right-16 lg:bottom-20" delay={0.4} />
            <FloatingIcon icon={ReceiptText} label="Caisse" className="left-[43%] -top-2" delay={0.5} />
            <FloatingIcon icon={FileText} label="Documents" className="left-[40%] -bottom-3" delay={0.6} />

            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 flex h-52 w-52 items-center justify-center rounded-[36px] bg-white shadow-[0_30px_90px_rgba(6,26,77,0.13)] lg:h-64 lg:w-64 lg:rounded-[44px]"
            >
              <div className="flex flex-col items-center text-center">
                <Image src="/logo.png" alt="Doclyn" width={76} height={76} className="h-14 w-14 object-contain lg:h-16 lg:w-16" priority />
                <span className="mt-3 text-xl font-black text-[#0B43B5] lg:mt-4 lg:text-2xl">Doclyn</span>
                <span className="mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Hospital OS</span>
              </div>
            </motion.div>

            <div className="absolute bottom-8 left-8 z-20 bg-white px-4 py-3 shadow-[0_18px_40px_rgba(6,26,77,0.1)]">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Modules</p>
              <p className="mt-1 text-sm font-black text-[#061A4D]">Accueil · Soins · Caisse</p>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

function Orbit({ className }: { className: string }) {
  return <div className={`absolute rounded-full border ${className}`} />;
}

function FloatingIcon({ icon: Icon, label, className, delay }: { icon: LucideIcon; label: string; className: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.92 }}
      animate={{ opacity: 1, y: [0, -7, 0], scale: 1 }}
      transition={{ opacity: { duration: 0.45, delay }, y: { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay } }}
      className={`absolute z-20 flex items-center gap-2 bg-white/92 px-3 py-2 shadow-[0_16px_40px_rgba(6,26,77,0.11)] ring-1 ring-[#D7E7FB] backdrop-blur ${className}`}
    >
      <span className="flex h-8 w-8 items-center justify-center bg-[#EEF6FF] text-[#0B43B5]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-xs font-black text-[#061A4D]">{label}</span>
    </motion.div>
  );
}
