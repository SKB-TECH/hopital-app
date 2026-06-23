import { api } from "@/shared/lib/http/api";
import type {
  ApiListResponse,
  ApiMessageResponse,
  CreateTicketPayload,
  Ticket,
  UpdateTicketPayload,
} from "@/shared/types/ticket";

const BASE_PATH = "/tickets";

function normalizeTicketsResponse(payload: unknown): Ticket[] {
  if (Array.isArray(payload)) {
    return payload as Ticket[];
  }

  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;

    if (Array.isArray(data.items)) {
      return data.items as Ticket[];
    }

    if (Array.isArray(data.data)) {
      return data.data as Ticket[];
    }
  }

  return [];
}

export const ticketService = {
  async getTickets(): Promise<ApiListResponse<Ticket>> {
    const res = await api.get(BASE_PATH);
    const items = normalizeTicketsResponse(res.data);

    if (res.data && typeof res.data === "object" && "items" in res.data) {
      return res.data as ApiListResponse<Ticket>;
    }

    return {
      items,
      total: items.length,
    };
  },

  async getTicketById(id: string): Promise<Ticket> {
    const res = await api.get(`${BASE_PATH}/${id}`);
    return res.data as Ticket;
  },

  async createTicket(payload: CreateTicketPayload): Promise<Ticket> {
    const res = await api.post(BASE_PATH, payload);
    return res.data as Ticket;
  },

  async updateTicket(id: string, payload: UpdateTicketPayload): Promise<Ticket> {
    const res = await api.patch(`${BASE_PATH}/${id}`, payload);
    return res.data as Ticket;
  },

  async deleteTicket(id: string): Promise<ApiMessageResponse> {
    const res = await api.delete(`${BASE_PATH}/${id}`);
    return (res.data ?? { message: "Ticket supprimé avec succès." }) as ApiMessageResponse;
  },
};
