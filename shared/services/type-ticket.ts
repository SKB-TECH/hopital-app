import { api } from "@/shared/lib/http/api";
import type {
  ApiListResponse,
  CreateTypeTicketPayload,
  TypeTicket,
} from "@/shared/types/type-ticket";

const BASE_PATH = "/ticket-types";

function normalizeTypeTicketsResponse(payload: unknown): TypeTicket[] {
  if (Array.isArray(payload)) {
    return payload as TypeTicket[];
  }

  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;

    if (Array.isArray(data.items)) {
      return data.items as TypeTicket[];
    }

    if (Array.isArray(data.data)) {
      return data.data as TypeTicket[];
    }
  }

  return [];
}

export const typeTicketService = {
  async getTypeTickets(): Promise<ApiListResponse<TypeTicket>> {
    const res = await api.get(BASE_PATH);
    const items = normalizeTypeTicketsResponse(res.data);

    if (res.data && typeof res.data === "object" && "items" in res.data) {
      return res.data as ApiListResponse<TypeTicket>;
    }

    return {
      items,
      total: items.length,
    };
  },

  async createTypeTicket(payload: CreateTypeTicketPayload): Promise<TypeTicket> {
    const res = await api.post(BASE_PATH, payload);
    return res.data as TypeTicket;
  },
};
