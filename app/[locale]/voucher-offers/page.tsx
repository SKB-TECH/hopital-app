import CrudResourcePage from "@/components/resources/CrudResourcePage";
import { getTranslations } from "next-intl/server";

export default async function VoucherOffersPage() {
  const t = await getTranslations("resourcePages");
  const c = (key: string) => t(`common.${key}`);

  return (
    <CrudResourcePage
      title={t("voucherOffers.title")}
      description={t("voucherOffers.description")}
      endpoint="/voucher-offers"
      createLabel={t("voucherOffers.create")}
      fields={[
        { name: "title", label: c("title"), required: true },
        { name: "category", label: c("category") },
        { name: "city", label: c("city") },
        { name: "description", label: c("description") },
        { name: "price", label: c("price"), type: "number", required: true },
        { name: "currency", label: c("currency"), placeholder: "USD" },
        { name: "discount", label: c("discount"), type: "number" },
        { name: "imageUrl", label: c("image"), type: "cloudinary" },
        { name: "validUntil", label: c("validUntil"), type: "datetime" },
        { name: "stock", label: c("stock"), type: "number" },
        { name: "isActive", label: c("active"), type: "checkbox" },
      ]}
      columns={[
        { key: "title", label: c("title") },
        { key: "category", label: c("category") },
        { key: "city", label: c("city") },
        { key: "price", label: c("price") },
        { key: "discount", label: c("discount") },
        { key: "currency", label: c("currency") },
        { key: "stock", label: c("stock") },
        { key: "isActive", label: c("active") },
      ]}
    />
  );
}
