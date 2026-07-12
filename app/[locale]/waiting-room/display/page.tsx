"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCircle2, Clock, Droplets, HeartPulse, Maximize2, Monitor, Settings, ShieldCheck, Volume2 } from "lucide-react";

type QueuePayload = {
  nowCalling: Array<{ ticketNumber: string; destination?: string; status: string }>;
  waiting: Array<{ ticketNumber: string; destination?: string; patientsBefore?: number; status: string }>;
  updatedAt: string;
};
type Option = { id: string; label: string; description?: string };

const storageKey = "afia.waitingRoom.display";

const slides = [
  {
    title: "Bienvenue à Afia-Smart",
    subtitle: "Notre équipe vous appellera par votre numéro de ticket.",
    advice: "Gardez votre ticket visible et restez proche de l’écran.",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1600&q=80",
    icon: HeartPulse,
  },
  {
    title: "Pendant l’attente",
    subtitle: "Préparez vos documents médicaux et votre pièce d’identité.",
    advice: "Si votre état s’aggrave, signalez-le immédiatement à la réception.",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1600&q=80",
    icon: ShieldCheck,
  },
  {
    title: "Hydratation et hygiène",
    subtitle: "Lavez-vous les mains ou utilisez du gel hydroalcoolique.",
    advice: "Pour protéger les autres patients, couvrez la bouche en cas de toux.",
    image: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1600&q=80",
    icon: Droplets,
  },
];

export default function WaitingRoomDisplayPage() {
  const [facilityId, setFacilityId] = useState("");
  const [practitionerId, setPractitionerId] = useState("");
  const [configured, setConfigured] = useState(false);
  const [facilities, setFacilities] = useState<Option[]>([]);
  const [practitioners, setPractitioners] = useState<Option[]>([]);
  const [data, setData] = useState<QueuePayload>({ nowCalling: [], waiting: [], updatedAt: new Date().toISOString() });
  const [error, setError] = useState("");
  const [slideIndex, setSlideIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const lastAnnouncedTicket = useRef("");
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const saved = localStorage.getItem(storageKey);
    const parsed = saved ? JSON.parse(saved) : {};
    const nextFacilityId = params.get("facilityId") || parsed.facilityId || "";
    const nextPractitionerId = params.get("practitionerId") || parsed.practitionerId || "";
    setFacilityId(nextFacilityId);
    setPractitionerId(nextPractitionerId);
    setConfigured(Boolean(nextFacilityId || nextPractitionerId));
    void loadOptions(nextFacilityId);
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ facilityId, practitionerId }));
  }, [facilityId, practitionerId]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (facilityId.trim()) params.set("facilityId", facilityId.trim());
    if (practitionerId.trim()) params.set("practitionerId", practitionerId.trim());
    return params.toString();
  }, [facilityId, practitionerId]);

  async function load() {
    if (!query) return;
    try {
      const response = await fetch(`/api/proxy/api/v1/reception/public-queue?${query}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "File indisponible");
      setData(payload);
      setError("");
    } catch (err: any) {
      setError(err?.message || "File indisponible");
    }
  }

  async function loadOptions(defaultFacilityId = "") {
    try {
      const response = await fetch("/api/proxy/api/v1/reception/public-options", { cache: "no-store" });
      const payload = await response.json();
      setFacilities(payload.facilities || []);
      setPractitioners(payload.practitioners || []);
      if (!defaultFacilityId && !facilityId && payload.facilities?.[0]?.id) setFacilityId(payload.facilities[0].id);
    } catch {
      setFacilities([]);
      setPractitioners([]);
    }
  }

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 4000);
    return () => clearInterval(timer);
  }, [query]);

  useEffect(() => {
    const timer = setInterval(() => setSlideIndex((current) => (current + 1) % slides.length), 9000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const mainTicket = data.nowCalling[0];
  const currentSlide = slides[slideIndex];
  const SlideIcon = currentSlide.icon;

  function startDisplay() {
    setConfigured(Boolean(facilityId || practitionerId));
    enableVoice();
    void document.documentElement.requestFullscreen?.().catch(() => undefined);
  }

  function enableVoice() {
    setVoiceEnabled(true);
    setError("");
    speakText("Voix activée. Les patients seront appelés avec une annonce vocale.", true);
  }

  function getFrenchVoice() {
    const availableVoices = "speechSynthesis" in window ? window.speechSynthesis.getVoices() : voices;
    return availableVoices.find((voice) => voice.lang === "fr-FR")
      || availableVoices.find((voice) => voice.lang.startsWith("fr"))
      || availableVoices[0]
      || null;
  }

  function announceTicket(ticketNumber: string, destination?: string) {
    if (!voiceEnabled) return;
    const readableTicket = formatTicketForSpeech(ticketNumber);
    const place = formatDestinationForSpeech(destination);
    speakText(`Ticket ${readableTicket}. Vous êtes invité ${place}. Je répète. Ticket ${readableTicket}, veuillez vous présenter ${place}.`);
  }

  function speakText(text: string, immediate = false) {
    playServerVoice(text, () => speakNativeVoice(text, immediate));
  }

  function speakNativeVoice(text: string, immediate = false) {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setError("La voix est indisponible sur ce navigateur.");
      return;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.voice = getFrenchVoice();
    utterance.rate = 0.86;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => {
      setError("");
    };
    utterance.onerror = () => {
      setError("La voix n’a pas démarré. Cliquez sur Tester la voix ou vérifiez que Chrome autorise le son pour ce site.");
    };
    currentUtterance.current = utterance;

    const speak = () => {
      window.speechSynthesis.speak(utterance);
      window.setTimeout(() => window.speechSynthesis.resume(), 250);
      window.setTimeout(() => window.speechSynthesis.resume(), 1000);
    };

    if (immediate) {
      speak();
    } else {
      window.setTimeout(speak, 180);
    }
  }

  function playServerVoice(text: string, onFail: () => void) {
    try {
      const audio = voiceAudio.current || new Audio();
      voiceAudio.current = audio;
      audio.pause();
      audio.currentTime = 0;
      audio.src = `/api/proxy/api/v1/reception/public-voice?text=${encodeURIComponent(text)}`;
      audio.volume = 1;
      audio.onplay = () => setError("");
      audio.onerror = onFail;
      void audio.play().catch(onFail);
    } catch {
      onFail();
    }
  }

  function formatTicketForSpeech(ticketNumber: string) {
    const normalized = ticketNumber.toUpperCase().replace(/[-_]/g, " ").trim();
    const match = normalized.match(/^([A-Z]+)\s*(\d+)$/);
    if (!match) return normalized;
    return `${match[1]} ${match[2].split("").join(" ")}`;
  }

  function formatDestinationForSpeech(destination?: string) {
    const clean = destination?.trim();
    if (!clean) return "à la consultation";
    if (/^(cabinet|bureau|salle|guichet)\b/i.test(clean)) return `au ${clean}`;
    if (/^service\b/i.test(clean)) return `au ${clean}`;
    return `au service ${clean}`;
  }

  useEffect(() => {
    if (!mainTicket?.ticketNumber) return;
    if (lastAnnouncedTicket.current === mainTicket.ticketNumber) return;
    lastAnnouncedTicket.current = mainTicket.ticketNumber;
    announceTicket(mainTicket.ticketNumber, mainTicket.destination);
  }, [mainTicket?.ticketNumber, mainTicket?.destination, voiceEnabled]);

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      {!configured && (
        <section className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-8">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center bg-blue-600">
              <Monitor className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-normal">Démarrer l’écran salle d’attente</h1>
              <p className="mt-2 text-lg font-semibold text-slate-300">À lancer chaque matin à la réception.</p>
            </div>
          </div>
          <div className="grid gap-4 border border-white/10 bg-white/5 p-6">
            <select value={facilityId} onChange={(event) => setFacilityId(event.target.value)} className="h-14 bg-white px-4 text-lg font-bold text-slate-950">
              <option value="">Choisir un site</option>
              {facilities.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <select value={practitionerId} onChange={(event) => setPractitionerId(event.target.value)} className="h-14 bg-white px-4 text-lg font-bold text-slate-950">
              <option value="">Tous les médecins du site</option>
              {practitioners.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <button onClick={startDisplay} className="flex h-14 items-center justify-center gap-3 bg-blue-600 px-5 text-lg font-black">
              <Maximize2 className="h-5 w-5" />
              Lancer en plein écran
            </button>
          </div>
        </section>
      )}

      {configured && (
        <>
          <header className="flex items-center justify-between border-b border-white/10 bg-[#091426]/95 px-10 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded bg-blue-600">
                <Monitor className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-normal">Salle d’attente</h1>
                <p className="text-lg font-semibold text-slate-300">Suivez l’écran et écoutez l’appel de votre ticket.</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              {!voiceEnabled && (
                <button onClick={enableVoice} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-slate-950 hover:bg-blue-50" title="Activer la voix">
                  <Volume2 className="h-5 w-5 text-blue-700" />
                  Activer la voix
                </button>
              )}
              {voiceEnabled && (
                <button onClick={() => announceTicket(mainTicket?.ticketNumber || "Q-000", mainTicket?.destination || "accueil")} className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-black text-white ring-1 ring-white/15 hover:bg-white/15" title="Tester la voix">
                  <Volume2 className="h-5 w-5 text-blue-200" />
                  Tester la voix
                </button>
              )}
              <button onClick={() => setConfigured(false)} className="text-slate-400 hover:text-white" title="Configurer">
                <Settings className="h-6 w-6" />
              </button>
              <div className="flex items-center gap-3 text-slate-300">
                <Clock className="h-5 w-5" />
                <span className="text-2xl font-black">{new Date(data.updatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          </header>

          {error && <p className="mx-10 mt-6 border border-red-400 bg-red-950 px-5 py-4 text-xl font-black text-red-100">{error}</p>}

          <section className="grid min-h-[calc(100vh-105px)] gap-8 p-8 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              {slides.map((slide, index) => (
                <div
                  key={slide.title}
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === slideIndex ? "opacity-100" : "opacity-0"}`}
                  style={{ backgroundImage: `linear-gradient(90deg, rgba(7,17,31,.92), rgba(7,17,31,.55)), url(${slide.image})` }}
                />
              ))}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,.35),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,.20),transparent_28%)]" />

              <div className="relative z-10 flex min-h-full flex-col justify-between p-10 xl:p-12">
                <div className="flex items-center justify-between gap-6">
                  <div className="inline-flex items-center gap-3 rounded-full bg-white/12 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-blue-100 ring-1 ring-white/15 backdrop-blur">
                    <SlideIcon className="h-5 w-5" />
                    Conseil santé
                  </div>
                  <div className="flex gap-2">
                    {slides.map((slide, index) => (
                      <button
                        key={slide.title}
                        onClick={() => setSlideIndex(index)}
                        className={`h-2.5 rounded-full transition-all ${index === slideIndex ? "w-10 bg-white" : "w-2.5 bg-white/35"}`}
                        aria-label={`Afficher le conseil ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="max-w-3xl py-10">
                  <h2 className="text-[clamp(3.2rem,6vw,6.5rem)] font-black leading-[0.95] tracking-normal text-white drop-shadow">
                    {currentSlide.title}
                  </h2>
                  <p className="mt-6 max-w-2xl text-[clamp(1.4rem,2.1vw,2.4rem)] font-bold leading-tight text-blue-50">
                    {currentSlide.subtitle}
                  </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
                  <div className="rounded-2xl border border-white/15 bg-white/12 p-6 backdrop-blur">
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-100">À retenir</p>
                    <p className="mt-3 text-2xl font-black leading-snug text-white">{currentSlide.advice}</p>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white p-6 text-slate-950 shadow-xl">
                    <div className="flex items-center gap-3 text-blue-700">
                      <Volume2 className="h-6 w-6" />
                      <p className="text-sm font-black uppercase tracking-[0.16em]">Appel en cours</p>
                    </div>
                    {mainTicket ? (
                      <>
                        <p className="mt-4 animate-pulse text-[clamp(4.5rem,8vw,8rem)] font-black leading-none text-blue-700">{mainTicket.ticketNumber}</p>
                        <p className="mt-3 text-2xl font-black">{mainTicket.destination || "Cabinet"}</p>
                        <p className="mt-2 text-base font-bold text-slate-500">Veuillez vous présenter.</p>
                      </>
                    ) : (
                      <>
                        <p className="mt-5 text-4xl font-black text-slate-900">En attente d’appel</p>
                        <p className="mt-3 text-base font-bold text-slate-500">Merci de surveiller votre numéro.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <aside className="flex min-h-full flex-col rounded-2xl bg-white p-8 text-slate-950 shadow-2xl">
              <div className="mb-7 flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-700">File d’attente</p>
                  <h2 className="mt-2 text-4xl font-black tracking-normal">Prochains tickets</h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <Bell className="h-7 w-7" />
                </div>
              </div>

              <div className="grid flex-1 content-start gap-4">
                {data.waiting.slice(0, 8).map((item, index) => {
                  const prepare = item.patientsBefore === 0;
                  return (
                    <div
                      key={`${item.ticketNumber}-${index}`}
                      className={`grid grid-cols-[130px_1fr] items-center rounded-xl border p-5 transition ${prepare ? "border-blue-200 bg-blue-50 shadow-sm" : "border-slate-200 bg-white"}`}
                    >
                      <p className={`text-4xl font-black ${prepare ? "text-blue-700" : "text-slate-900"}`}>{item.ticketNumber}</p>
                      <div>
                        <p className="flex items-center gap-2 text-2xl font-black">
                          {prepare && <CheckCircle2 className="h-6 w-6 text-blue-700" />}
                          {prepare ? "Préparez-vous" : `${item.patientsBefore} patient(s) avant vous`}
                        </p>
                        <p className="mt-1 text-base font-bold text-slate-500">{item.destination || "Salle d’attente"}</p>
                      </div>
                    </div>
                  );
                })}
                {!data.waiting.length && (
                  <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-8 text-center">
                    <p className="text-2xl font-black text-slate-500">Aucun patient en attente.</p>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-xl bg-slate-950 p-5 text-white">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-200">Message</p>
                <p className="mt-2 text-xl font-black">Merci de garder le calme et de laisser passer les urgences.</p>
              </div>
            </aside>
          </section>
        </>
      )}
    </main>
  );
}
