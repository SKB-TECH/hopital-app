const REQUIRED_FIELDS = ["eventId", "name", "price", "currency", "quantity"] as const;

export type TypeTicketFormValues = {
  eventId: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  quantity: string;
  saleStartAt: string;
  saleEndAt: string;
};

export type TypeTicketFormErrors = Partial<Record<(typeof REQUIRED_FIELDS)[number], string>>;

export const typeTicketInitialValues: TypeTicketFormValues = {
  eventId: "",
  name: "",
  description: "",
  price: "",
  currency: "",
  quantity: "",
  saleStartAt: "",
  saleEndAt: "",
};

export function validateTypeTicketPayload(values: TypeTicketFormValues): TypeTicketFormErrors {
  const errors: TypeTicketFormErrors = {};

  if (!values.eventId.trim()) errors.eventId = "L'identifiant de l'événement est requis.";
  if (!values.name.trim()) errors.name = "Le nom du type de ticket est requis.";
  if (!values.currency.trim()) errors.currency = "La devise est requise.";

  if (!values.price.trim()) {
    errors.price = "Le prix est requis.";
  } else if (Number(values.price) < 0 || Number.isNaN(Number(values.price))) {
    errors.price = "Le prix doit être un nombre positif.";
  }

  if (!values.quantity.trim()) {
    errors.quantity = "La quantité est requise.";
  } else if (Number(values.quantity) < 0 || Number.isNaN(Number(values.quantity))) {
    errors.quantity = "La quantité doit être un nombre positif.";
  }

  return errors;
}
