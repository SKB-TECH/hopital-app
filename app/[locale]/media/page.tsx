"use client";

import CrudResourcePage from "@/components/resources/CrudResourcePage";
import { useTranslations } from "next-intl";

export default function MediaPage() {
  const t = useTranslations("resources.media");

  return (
    <CrudResourcePage
      title={t("title")}
      description={t("description")}
      endpoint="/media"
      createLabel={t("create")}
      fields={[
        { name: "eventId", label: t("fields.event"), type: "select", endpoint: "/events", nameKey: "title", required: true },
        { name: "url", label: t("fields.url"), type: "cloudinary", placeholder: "https://res.cloudinary.com/...", required: true },
        { name: "type", label: t("fields.type"), placeholder: "image" },
        { name: "size", label: t("fields.size"), type: "number" },
      ]}
      columns={[
        { key: "event", label: t("fields.event") },
        { key: "url", label: t("fields.url") },
        { key: "type", label: t("fields.type") },
        { key: "size", label: t("fields.size") },
        { key: "createdAt", label: t("fields.createdAt") },
      ]}
    />
  );
}
