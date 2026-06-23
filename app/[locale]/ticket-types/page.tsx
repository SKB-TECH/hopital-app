"use client";

import CrudResourcePage from "@/components/resources/CrudResourcePage";
import { useTranslations } from "next-intl";

export default function TicketTypesPage() {
  const t = useTranslations("resources.ticketTypes");

  return (
    <CrudResourcePage
      title={t("title")}
      description={t("description")}
      endpoint="/ticket-types"
      createLabel={t("create")}
      fields={[
        { name: "eventId", label: t("fields.event"), type: "select", endpoint: "/events", nameKey: "title", required: true },
        { name: "name", label: t("fields.name"), required: true },
        { name: "description", label: t("fields.description") },
        { name: "price", label: t("fields.price"), type: "number" },
        { name: "currency", label: t("fields.currency"), placeholder: "USD" },
        { name: "quantity", label: t("fields.quantity"), type: "number", required: true },
        { name: "saleStartAt", label: t("fields.saleStartAt") },
        { name: "saleEndAt", label: t("fields.saleEndAt") },
      ]}
      columns={[
        { key: "name", label: t("fields.name") },
        { key: "event", label: t("fields.event") },
        { key: "price", label: t("fields.price") },
        { key: "currency", label: t("fields.currency") },
        { key: "quantity", label: t("fields.quantity") },
      ]}
    />
  );
}
