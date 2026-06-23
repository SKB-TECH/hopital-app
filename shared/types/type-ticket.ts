export type TypeTicket = {
  id: string;
  eventId: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  quantity: number;
  saleStartAt?: string | null;
  saleEndAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTypeTicketPayload = {
  eventId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  quantity: number;
  saleStartAt?: string;
  saleEndAt?: string;
};

export type ApiListResponse<T> = {
  items: T[];
  total?: number;
  page?: number;
  pageSize?: number;
};
