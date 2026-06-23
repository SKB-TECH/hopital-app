"use client";

import CrudResourcePage from "@/components/resources/CrudResourcePage";
import { useTranslations } from "next-intl";

export default function OrganizersPage() {
  const t = useTranslations("resources.organizers");

  return (
    <CrudResourcePage
      title={t("title")}
      description={t("description")}
      endpoint="/organizers"
      createLabel={t("create")}
      fields={[
        { name: "userId", label: t("fields.user"), type: "select", endpoint: "/users", nameKey: "name", required: true },
        { name: "organizationId", label: t("fields.organization"), type: "select", endpoint: "/organizations" },
        { name: "displayName", label: t("fields.displayName"), required: true },
        { name: "description", label: t("fields.description") },
        { name: "isVerified", label: t("fields.verified"), type: "checkbox" },
      ]}
      columns={[
        { key: "displayName", label: t("fields.displayName") },
        { key: "user", label: t("fields.user") },
        { key: "organization", label: t("fields.organization") },
        { key: "isVerified", label: t("fields.verified") },
      ]}
    />
  );
}
