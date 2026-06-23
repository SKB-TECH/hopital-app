"use client";

import CrudResourcePage from "@/components/resources/CrudResourcePage";
import { useTranslations } from "next-intl";

export default function SponsorsPage() {
  const t = useTranslations("resources.sponsors");

  return (
    <CrudResourcePage
      title={t("title")}
      description={t("description")}
      endpoint="/sponsors"
      createLabel={t("create")}
      fields={[
        { name: "name", label: t("fields.name"), required: true },
        { name: "logoUrl", label: t("fields.logo"), type: "cloudinary", placeholder: "https://res.cloudinary.com/..." },
        { name: "website", label: t("fields.website"), type: "url", placeholder: "https://example.com" },
      ]}
      columns={[
        { key: "name", label: t("fields.name") },
        { key: "website", label: t("fields.website") },
        { key: "logoUrl", label: t("fields.logo") },
        { key: "createdAt", label: t("fields.createdAt") },
      ]}
    />
  );
}
