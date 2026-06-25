import { redirect } from "next/navigation";
export default async function HospitalPage({ params }: { params: Promise<{ locale: string }> | { locale: string } }) {
  const resolved = await Promise.resolve(params);
  redirect(`/${resolved.locale}/overview`);
}
