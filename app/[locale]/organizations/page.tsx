"use client";

import CrudResourcePage from "@/components/resources/CrudResourcePage";
import { useTranslations } from "next-intl";

export default function OrganizationsPage() {
  const t = useTranslations("resources.organizations");

  return (
    <CrudResourcePage
      title={t("title")}
      description={t("description")}
      endpoint="/organizations"
      createLabel={t("create")}
      fields={[
        { name: "name", label: t("fields.name"), required: true },
        { name: "slug", label: t("fields.slug"), required: true },
        { name: "logoUrl", label: t("fields.logo"), type: "cloudinary", placeholder: "https://res.cloudinary.com/..." },
        { name: "domain", label: t("fields.domain"), placeholder: "example.com" },
        { name: "primaryColor", label: t("fields.primaryColor"), placeholder: "#2563eb" },
        { name: "plan", label: t("fields.plan"), placeholder: "free" },
      ]}
      columns={[
        { key: "name", label: t("fields.name") },
        { key: "slug", label: t("fields.slug") },
        { key: "domain", label: t("fields.domain") },
        { key: "plan", label: t("fields.plan") },
      ]}
    />
  );
}
