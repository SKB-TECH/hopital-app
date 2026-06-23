import CrudResourcePage from "@/components/resources/CrudResourcePage";
import { getTranslations } from "next-intl/server";

export default async function ReviewsPage() {
  const t = await getTranslations("resourcePages");
  const c = (key: string) => t(`common.${key}`);

  return (
    <CrudResourcePage
      title={t("reviews.title")}
      description={t("reviews.description")}
      endpoint="/reviews"
      createLabel={t("reviews.create")}
      fields={[
        { name: "eventId", label: c("event"), type: "select", endpoint: "/events", nameKey: "title", required: true },
        { name: "attendeeName", label: c("attendeeName") },
        { name: "attendeeEmail", label: c("attendeeEmail") },
        { name: "rating", label: c("rating"), type: "number", required: true },
        { name: "title", label: c("title") },
        { name: "comment", label: c("reviewText"), required: true },
        { name: "visibility", label: c("visibility"), placeholder: "PUBLIC or HIDDEN" },
      ]}
      columns={[
        { key: "attendeeName", label: c("attendee") },
        { key: "eventName", label: c("event") },
        { key: "rating", label: c("rating") },
        { key: "reviewText", label: c("review") },
        { key: "visibility", label: c("visibility") },
        { key: "helpful", label: c("helpful") },
        { key: "date", label: c("date") },
      ]}
    />
  );
}
