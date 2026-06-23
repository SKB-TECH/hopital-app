import {
    HelpCircle,
    ScrollText,
    Settings,
    ShieldCheck,
} from "lucide-react";

export default function AuthShell({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-slate-100">
            <section
                className="relative mx-auto flex min-h-screen flex-col overflow-hidden rounded border border-slate-200 bg-[#f8f9fc]"
                style={{
                    backgroundImage: "radial-gradient(#cfd5e2 1px, transparent 1px)",
                    backgroundSize: "18px 18px",
                }}
            >
                {/*ajouter quelque chose*/}
                <div className="flex flex-1 items-center justify-center px-4 py-10">
                    {children}
                </div>

                <footer className="flex flex-col gap-3 px-6 pb-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
                    <p>© 2026 Kongo Event. All right reserved.</p>

                    <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" /> Privacy
            </span>
                        <span className="inline-flex items-center gap-1.5">
              <ScrollText className="size-3.5" /> Terms
            </span>
                        <span className="inline-flex items-center gap-1.5">
              <HelpCircle className="size-3.5" /> Get help
            </span>
                    </div>
                </footer>
            </section>
        </main>
    );
}
