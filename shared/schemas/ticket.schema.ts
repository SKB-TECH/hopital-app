const REQUIRED_FIELDS = [
  "eventId",
  "ticketTypeId",
  "userId",
] as const;

export type TicketFormValues = {
  eventId: string;
  ticketTypeId: string;
  userId: string;
};

export type TicketFormErrors = Partial<Record<(typeof REQUIRED_FIELDS)[number], string>>;

export const ticketInitialValues: TicketFormValues = {
  eventId: "",
  ticketTypeId: "",
  userId: "",
};

export function validateTicketPayload(values: TicketFormValues): TicketFormErrors {
  const errors: TicketFormErrors = {};

  if (!values.eventId.trim()) errors.eventId = "L'identifiant de l'événement est requis.";
  if (!values.ticketTypeId.trim()) errors.ticketTypeId = "Le type de ticket est requis.";
  if (!values.userId.trim()) errors.userId = "L'identifiant utilisateur est requis.";

  return errors;
}
