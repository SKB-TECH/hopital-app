import CrudResourcePage from "@/components/resources/CrudResourcePage";
import { getTranslations } from "next-intl/server";

export default async function FlightOffersPage() {
  const t = await getTranslations("resourcePages");
  const c = (key: string) => t(`common.${key}`);

  return (
    <CrudResourcePage
      title={t("flightOffers.title")}
      description={t("flightOffers.description")}
      endpoint="/flight-offers"
      createLabel={t("flightOffers.create")}
      fields={[
        { name: "origin", label: c("origin"), required: true },
        { name: "destination", label: c("destination"), required: true },
        { name: "airlineName", label: c("airline") },
        { name: "flightNumber", label: c("flightNumber") },
        { name: "departureAt", label: c("departureAt"), type: "datetime" },
        { name: "arrivalAt", label: c("arrivalAt"), type: "datetime" },
        { name: "price", label: c("price"), type: "number", required: true },
        { name: "currency", label: c("currency"), placeholder: "USD" },
        { name: "imageUrl", label: c("image"), type: "cloudinary" },
        { name: "seatsAvailable", label: c("seatsAvailable"), type: "number" },
        { name: "isActive", label: c("active"), type: "checkbox" },
      ]}
      columns={[
        { key: "origin", label: c("origin") },
        { key: "destination", label: c("destination") },
        { key: "airlineName", label: c("airline") },
        { key: "flightNumber", label: c("flight") },
        { key: "departureAt", label: c("departure") },
        { key: "price", label: c("price") },
        { key: "currency", label: c("currency") },
        { key: "seatsAvailable", label: c("seats") },
        { key: "isActive", label: c("active") },
      ]}
    />
  );
}
