import Image from "next/image";

type LoaderProps = {
  label?: string;
  fullScreen?: boolean;
};

export function Loader({ label = "Préparation de votre espace hospitalier...", fullScreen = false }: LoaderProps) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-[#f3f6fb] text-slate-950 ${fullScreen ? "min-h-screen" : "min-h-64 py-10"}`}>
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(30,64,175,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(30,64,175,.06)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative z-10 flex w-[min(92vw,420px)] flex-col items-center border border-slate-200 bg-white px-8 py-10 text-center shadow-sm">
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-ping bg-blue-600/10" />
          <div className="absolute inset-2 border border-blue-100" />
          <div className="relative flex h-16 w-16 items-center justify-center bg-white shadow-lg">
            <Image src="/logo.png" alt="Afia-Smart" width={44} height={44} className="h-11 w-11 object-contain" priority />
          </div>
        </div>
        <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-700">Afia-Smart</p>
        <p className="mt-3 max-w-sm text-base font-semibold text-slate-600">{label}</p>
        <div className="mt-6 h-1.5 w-64 overflow-hidden bg-slate-100">
          <div className="h-full w-1/2 animate-[loader-slide_1.25s_ease-in-out_infinite] bg-blue-700" />
        </div>
      </div>
    </div>
  );
}
