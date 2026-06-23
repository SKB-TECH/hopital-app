"use client";

import CrudResourcePage from "@/components/resources/CrudResourcePage";
import { useTranslations } from "next-intl";

export default function EventSponsorsPage() {
  const t = useTranslations("resources.eventSponsors");

  return (
    <CrudResourcePage
      title={t("title")}
      description={t("description")}
      endpoint="/event-sponsors"
      createLabel={t("create")}
      idFields={["eventId", "sponsorId"]}
      canUpdate={false}
      fields={[
        { name: "eventId", label: t("fields.event"), type: "select", endpoint: "/events", nameKey: "title", required: true },
        { name: "sponsorId", label: t("fields.sponsor"), type: "select", endpoint: "/sponsors", required: true },
      ]}
      columns={[
        { key: "event", label: t("fields.event") },
        { key: "sponsor", label: t("fields.sponsor") },
        { key: "eventId", label: t("fields.eventId") },
        { key: "sponsorId", label: t("fields.sponsorId") },
      ]}
    />
  );
}
