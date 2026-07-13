"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BadgeCheck, Building2, Loader2, LockKeyhole, Mail, Phone, Save, type LucideIcon, UserRound } from "lucide-react";
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
      const { department: _department, ...payload } = profile;
      await authService.updateProfile(payload);
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
        <div className="mx-auto max-w-6xl px-5 py-7">
          <section className="mb-6 border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-5 border-b border-slate-200 px-6 py-6 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-700 dark:text-blue-300">Compte utilisateur</p>
                <h1 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">Mon compte</h1>
                <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                  Informations personnelles, coordonnées et sécurité de connexion.
                </p>
              </div>
              <div className="flex min-w-0 items-center gap-3 border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex size-10 shrink-0 items-center justify-center bg-white text-sm font-black text-blue-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                  {userInitials(user?.fullName || `${profile.firstName} ${profile.lastName}`)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950 dark:text-white">{user?.fullName || `${profile.firstName} ${profile.lastName}`.trim() || "Utilisateur"}</p>
                  <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{profile.email || "-"}</p>
                </div>
              </div>
            </div>
            <div className="grid divide-y divide-slate-200 dark:divide-slate-800 md:grid-cols-3 md:divide-x md:divide-y-0">
              <SummaryItem icon={Mail} label="Email" value={profile.email || "-"} />
              <SummaryItem icon={Phone} label="Téléphone" value={profile.phone || "Non renseigné"} />
              <SummaryItem icon={Building2} label="Service" value={profile.department || "Non renseigné"} />
            </div>
          </section>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center border border-slate-200 bg-white"><Loader2 className="size-6 animate-spin text-blue-700" /></div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <section className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                  <div className="flex size-10 items-center justify-center bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><UserRound className="size-5" /></div>
                  <div>
                    <h2 className="text-lg font-black text-slate-950 dark:text-white">Informations utilisateur</h2>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Ces informations apparaissent sur les documents et journaux d’activité.</p>
                  </div>
                </div>
                <div className="grid gap-5 p-6 md:grid-cols-2">
                  <Field label="Prénom" value={profile.firstName} onChange={(value) => setProfile({ ...profile, firstName: value })} />
                  <Field label="Nom" value={profile.lastName} onChange={(value) => setProfile({ ...profile, lastName: value })} />
                  <Field label="Email de connexion" type="email" value={profile.email} onChange={(value) => setProfile({ ...profile, email: value })} />
                  <Field label="Téléphone" value={profile.phone} onChange={(value) => setProfile({ ...profile, phone: value })} />
                  <div className="md:col-span-2">
                    <ReadOnlyField label="Département / service" value={profile.department || "Non renseigné"} hint="Modification réservée à l’administrateur." />
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                    <BadgeCheck className="size-4" />
                    Modification enregistrée dans l’audit
                  </div>
                  <button onClick={saveProfile} disabled={Boolean(saving)} className="inline-flex h-12 items-center gap-2 bg-blue-700 px-6 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-50">
                    {saving === "profile" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Enregistrer
                  </button>
                </div>
              </section>

              <section className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                  <div className="flex size-10 items-center justify-center bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><LockKeyhole className="size-5" /></div>
                  <div>
                    <h2 className="text-lg font-black text-slate-950 dark:text-white">Mot de passe</h2>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">L’ancien mot de passe est obligatoire.</p>
                  </div>
                </div>
                <div className="space-y-5 p-6">
                  <Field label="Mot de passe actuel" type="password" value={passwords.currentPassword} onChange={(value) => setPasswords({ ...passwords, currentPassword: value })} />
                  <Field label="Nouveau mot de passe" type="password" value={passwords.newPassword} onChange={(value) => setPasswords({ ...passwords, newPassword: value })} />
                  <Field label="Confirmer le nouveau mot de passe" type="password" value={passwords.confirmPassword} onChange={(value) => setPasswords({ ...passwords, confirmPassword: value })} />
                  <div className="border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                    Après changement, les anciennes sessions sont révoquées et une nouvelle connexion sera demandée.
                  </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950">
                  <button onClick={changePassword} disabled={Boolean(saving)} className="inline-flex h-12 w-full items-center justify-center gap-2 bg-slate-900 px-6 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800">
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

function userInitials(name: string) {
  return String(name || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

function SummaryItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-6 py-4">
      <div className="flex size-10 shrink-0 items-center justify-center bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 truncate text-sm font-black text-slate-950 dark:text-white">{value}</p>
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

function ReadOnlyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <div className="flex min-h-12 items-center border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
        {value}
      </div>
      {hint ? <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}
