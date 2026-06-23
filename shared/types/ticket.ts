export const TICKET_STATUSES = ["PENDING", "ACTIVE", "USED", "CANCELLED"] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export type Ticket = {
  id: string;
  eventId: string;
  ticketTypeId: string;
  userId: string;
  code: string;
  qrCodeUrl: string;
  status: TicketStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTicketPayload = {
  eventId: string;
  ticketTypeId: string;
  userId: string;
  code?: string;
  qrCodeUrl?: string;
  status?: TicketStatus;
};

export type UpdateTicketPayload = Partial<CreateTicketPayload>;

export type ApiMessageResponse = {
  message: string;
};

export type ApiListResponse<T> = {
  items: T[];
  total?: number;
  page?: number;
  pageSize?: number;
};
