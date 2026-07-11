import { redirect } from "next/navigation";

export default async function PayoutsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/hospital/billing`);
}
