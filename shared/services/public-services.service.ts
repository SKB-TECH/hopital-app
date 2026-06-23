import { api } from "@/shared/lib/http/api";
import type {
  GetPublicServiceOffersParams,
  PublicServiceKind,
  PublicServiceOffersResponse,
} from "@/shared/types/public-services.types";

const endpoints: Record<PublicServiceKind, string> = {
  buses: "/public/bus-routes",
  flights: "/public/flight-offers",
  vouchers: "/public/voucher-offers",
  stay: "/public/stay-offers",
};

function buildQuery(params?: GetPublicServiceOffersParams) {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.q) searchParams.set("q", params.q);
  if (params?.city) searchParams.set("city", params.city);
  if (params?.origin) searchParams.set("origin", params.origin);
  if (params?.destination) searchParams.set("destination", params.destination);

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const publicServicesService = {
  async getOffers(service: PublicServiceKind, params?: GetPublicServiceOffersParams): Promise<PublicServiceOffersResponse> {
    const res = await api.get(`${endpoints[service]}${buildQuery(params)}`, { skipAuth: true } as any);
    return res.data;
  },
};
