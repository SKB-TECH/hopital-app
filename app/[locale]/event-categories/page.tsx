"use client";

import CrudResourcePage from "@/components/resources/CrudResourcePage";
import { useTranslations } from "next-intl";

export default function EventCategoriesPage() {
  const t = useTranslations("resources.eventCategories");

  return (
    <CrudResourcePage
      title={t("title")}
      description={t("description")}
      endpoint="/event-categories"
      createLabel={t("create")}
      fields={[
        { name: "name", label: t("fields.name"), required: true },
        { name: "slug", label: t("fields.slug"), required: true, placeholder: "music-festival" },
      ]}
      columns={[
        { key: "name", label: t("fields.name") },
        { key: "slug", label: t("fields.slug") },
        { key: "createdAt", label: t("fields.createdAt") },
      ]}
    />
  );
}
