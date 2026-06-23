"use client";

import CrudResourcePage from "@/components/resources/CrudResourcePage";
import { useTranslations } from "next-intl";

export default function VenuesPage() {
  const t = useTranslations("resources.venues");

  return (
    <CrudResourcePage
      title={t("title")}
      description={t("description")}
      endpoint="/venues"
      createLabel={t("create")}
      fields={[
        { name: "name", label: t("fields.name"), required: true },
        { name: "address", label: t("fields.address") },
        { name: "city", label: t("fields.city") },
        { name: "country", label: t("fields.country") },
        { name: "latitude", label: t("fields.latitude"), type: "number" },
        { name: "longitude", label: t("fields.longitude"), type: "number" },
      ]}
      columns={[
        { key: "name", label: t("fields.name") },
        { key: "city", label: t("fields.city") },
        { key: "country", label: t("fields.country") },
        { key: "address", label: t("fields.address") },
      ]}
    />
  );
}
