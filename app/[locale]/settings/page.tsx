"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BadgeCheck, Building2, Loader2, LockKeyhole, Mail, Phone, Save, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useSidebar } from "@/contexts/SidebarContext";
import { useMe } from "@/shared/hooks/auth.hooks";
import { authService } from "@/shared/services/auth.service";
import { tokenStore } from "@/shared/lib/tokenStore";

export default function SettingsPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "fr";
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const { data: user, isLoading, refetch } = useMe();
  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "", phone: "", department: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState<"" | "profile" | "password">("");

  useEffect(() => {
    if (!user) return;
    setProfile({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      department: user.department ?? "",
    });
  }, [user]);

  const saveProfile = async () => {
    setSaving("profile");
    try {
      await authService.updateProfile(profile);
      await refetch();
      toast.success("Profil mis à jour.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Impossible de modifier le profil.");
    } finally {
      setSaving("");
    }
  };

  const changePassword = async () => {
    if (passwords.newPassword.length < 10) return toast.warning("Le nouveau mot de passe doit contenir au moins 10 caractères.");
    if (passwords.newPassword !== passwords.confirmPassword) return toast.warning("La confirmation ne correspond pas.");
    setSaving("password");
    try {
      await authService.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      tokenStore.clear();
      toast.success("Mot de passe modifié. Reconnectez-vous.");
      router.replace(`/${locale}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Impossible de modifier le mot de passe.");
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar />
      <DashboardNavbar />
      <main className={`pt-20 transition-all duration-300 ${isCollapsed ? "lg:ml-[84px]" : "lg:ml-[340px]"}`}>
        <div className="mx-auto max-w-7xl px-5 py-8">
          <section className="mb-6 overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-6 bg-slate-950 px-6 py-7 text-white md:grid-cols-[1fr_360px]">
              <div className="flex items-start gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center bg-blue-700 text-white">
                  <ShieldCheck className="size-8" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Sécurité du compte</p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight">Mon compte</h1>
                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
                    Gérez vos informations personnelles, votre email de connexion et votre mot de passe sans passer par l’administrateur.
                  </p>
                </div>
              </div>
              <div className="border border-slate-700 bg-slate-900/80 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">Session connectée</p>
                <p className="mt-2 truncate text-lg font-black">{user?.fullName || `${profile.firstName} ${profile.lastName}`.trim() || "Utilisateur"}</p>
                <p className="mt-1 break-all text-sm font-semibold text-slate-300">{profile.email || "-"}</p>
              </div>
            </div>
            <div className="grid border-t border-slate-200 dark:border-slate-800 md:grid-cols-3">
              <SummaryItem icon={Mail} label="Email" value={profile.email || "-"} />
              <SummaryItem icon={Phone} label="Téléphone" value={profile.phone || "Non renseigné"} />
              <SummaryItem icon={Building2} label="Service" value={profile.department || "Non renseigné"} />
            </div>
          </section>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center border border-slate-200 bg-white"><Loader2 className="size-6 animate-spin text-blue-700" /></div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex size-12 items-center justify-center bg-blue-700 text-white"><UserRound className="size-5" /></div>
                  <div>
                    <h2 className="text-xl font-black text-slate-950">Informations utilisateur</h2>
                    <p className="text-sm font-semibold text-slate-500">Corrigez les erreurs de saisie visibles sur vos documents et journaux d’activité.</p>
                  </div>
                </div>
                <div className="grid gap-5 p-6 md:grid-cols-2">
                  <Field label="Prénom" value={profile.firstName} onChange={(value) => setProfile({ ...profile, firstName: value })} />
                  <Field label="Nom" value={profile.lastName} onChange={(value) => setProfile({ ...profile, lastName: value })} />
                  <Field label="Email de connexion" type="email" value={profile.email} onChange={(value) => setProfile({ ...profile, email: value })} />
                  <Field label="Téléphone" value={profile.phone} onChange={(value) => setProfile({ ...profile, phone: value })} />
                  <div className="md:col-span-2">
                    <Field label="Département / service" value={profile.department} onChange={(value) => setProfile({ ...profile, department: value })} />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    <BadgeCheck className="size-4" />
                    Modification auditée
                  </div>
                  <button onClick={saveProfile} disabled={Boolean(saving)} className="inline-flex h-12 items-center gap-2 bg-blue-700 px-6 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50">
                    {saving === "profile" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Enregistrer
                  </button>
                </div>
              </section>

              <section className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-950 px-6 py-5 text-white">
                  <div className="flex size-11 items-center justify-center bg-blue-700"><LockKeyhole className="size-5" /></div>
                  <div>
                    <h2 className="text-xl font-black">Mot de passe</h2>
                    <p className="text-sm font-semibold text-slate-300">L’ancien mot de passe est obligatoire.</p>
                  </div>
                </div>
                <div className="space-y-5 p-6">
                  <Field label="Mot de passe actuel" type="password" value={passwords.currentPassword} onChange={(value) => setPasswords({ ...passwords, currentPassword: value })} />
                  <Field label="Nouveau mot de passe" type="password" value={passwords.newPassword} onChange={(value) => setPasswords({ ...passwords, newPassword: value })} />
                  <Field label="Confirmer le nouveau mot de passe" type="password" value={passwords.confirmPassword} onChange={(value) => setPasswords({ ...passwords, confirmPassword: value })} />
                  <div className="border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                    Après changement, les anciennes sessions sont révoquées et une nouvelle connexion sera demandée.
                  </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950">
                  <button onClick={changePassword} disabled={Boolean(saving)} className="inline-flex h-12 w-full items-center justify-center gap-2 bg-slate-950 px-6 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50">
                    {saving === "password" ? <Loader2 className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />} Changer le mot de passe
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-r border-slate-200 px-6 py-4 last:border-r-0 dark:border-slate-800">
      <div className="flex size-10 shrink-0 items-center justify-center bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 truncate text-sm font-black text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-blue-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50" />
    </label>
  );
}
