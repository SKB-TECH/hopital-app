"use client";

import CrudResourcePage from "@/components/resources/CrudResourcePage";
import { useTranslations } from "next-intl";

export default function ManageTicketsPage() {
  const t = useTranslations("resources.tickets");

  return (
    <CrudResourcePage
      title={t("title")}
      description={t("description")}
      endpoint="/tickets"
      createLabel={t("create")}
      fields={[
        { name: "eventId", label: t("fields.event"), type: "select", endpoint: "/events", nameKey: "title", required: true },
        { name: "ticketTypeId", label: t("fields.ticketType"), type: "select", endpoint: "/ticket-types", required: true },
        { name: "userId", label: t("fields.userId") },
        { name: "code", label: t("fields.code") },
        { name: "qrCodeUrl", label: t("fields.qrCodeUrl"), type: "cloudinary" },
        { name: "status", label: t("fields.status") },
      ]}
      columns={[
        { key: "code", label: t("fields.code") },
        { key: "event", label: t("fields.event") },
        { key: "ticketType", label: t("fields.ticketType") },
        { key: "user", label: t("fields.user") },
        { key: "status", label: t("fields.status") },
      ]}
    />
  );
}
