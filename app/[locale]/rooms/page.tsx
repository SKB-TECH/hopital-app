"use client";

import CrudResourcePage from "@/components/resources/CrudResourcePage";
import { useTranslations } from "next-intl";

export default function RoomsPage() {
  const t = useTranslations("resources.rooms");

  return (
    <CrudResourcePage
      title={t("title")}
      description={t("description")}
      endpoint="/rooms"
      createLabel={t("create")}
      fields={[
        { name: "venueId", label: t("fields.venue"), type: "select", endpoint: "/venues", required: true },
        { name: "name", label: t("fields.name"), required: true },
        { name: "capacity", label: t("fields.capacity"), type: "number" },
      ]}
      columns={[
        { key: "name", label: t("fields.name") },
        { key: "venue", label: t("fields.venue") },
        { key: "capacity", label: t("fields.capacity") },
        { key: "createdAt", label: t("fields.createdAt") },
      ]}
    />
  );
}
