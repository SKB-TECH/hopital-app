import CrudResourcePage from "@/components/resources/CrudResourcePage";
import { getTranslations } from "next-intl/server";

export default async function StayOffersPage() {
  const t = await getTranslations("resourcePages");
  const c = (key: string) => t(`common.${key}`);

  return (
    <CrudResourcePage
      title={t("stayOffers.title")}
      description={t("stayOffers.description")}
      endpoint="/stay-offers"
      createLabel={t("stayOffers.create")}
      fields={[
        { name: "name", label: c("name"), required: true },
        { name: "city", label: c("city") },
        { name: "country", label: c("country") },
        { name: "address", label: c("address") },
        { name: "description", label: c("description") },
        { name: "price", label: c("price"), type: "number", required: true },
        { name: "currency", label: c("currency"), placeholder: "USD" },
        { name: "imageUrl", label: c("image"), type: "cloudinary" },
        { name: "rating", label: c("rating"), type: "number" },
        { name: "roomsAvailable", label: c("roomsAvailable"), type: "number" },
        { name: "isActive", label: c("active"), type: "checkbox" },
      ]}
      columns={[
        { key: "name", label: c("name") },
        { key: "city", label: c("city") },
        { key: "country", label: c("country") },
        { key: "price", label: c("price") },
        { key: "currency", label: c("currency") },
        { key: "rating", label: c("rating") },
        { key: "roomsAvailable", label: c("rooms") },
        { key: "isActive", label: c("active") },
      ]}
    />
  );
}
