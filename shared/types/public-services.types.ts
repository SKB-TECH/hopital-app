export type PublicServiceKind = "buses" | "flights" | "vouchers" | "stay";

export type PublicServiceOffer = {
  id: string;
  service: "bus" | "flight" | "voucher" | "stay";
  title: string;
  subtitle?: string | null;
  description?: string | null;
  price: number;
  discount?: number | null;
  currency: string;
  imageUrl?: string | null;
  stock?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  meta?: Record<string, unknown> | null;
};

export type PublicServiceOffersResponse = {
  data: PublicServiceOffer[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type GetPublicServiceOffersParams = {
  page?: number;
  limit?: number;
  q?: string;
  city?: string;
  origin?: string;
  destination?: string;
};
