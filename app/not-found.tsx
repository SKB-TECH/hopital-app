import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-destructive">404</p>
        <h1 className="mt-3 text-3xl font-extrabold text-primary">Page introuvable</h1>
        <Link href="/fr" className="mt-6 inline-flex text-sm font-bold text-primary underline">
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
