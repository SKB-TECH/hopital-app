import { redirect } from "next/navigation";

export default async function PromotionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/hospital`);
}
