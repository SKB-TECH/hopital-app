"use client";

import { useQuery } from "@tanstack/react-query";
import { publicServicesService } from "@/shared/services/public-services.service";
import type { GetPublicServiceOffersParams, PublicServiceKind } from "@/shared/types/public-services.types";

export function useGetPublicServiceOffers(service: PublicServiceKind, params?: GetPublicServiceOffersParams) {
  return useQuery({
    queryKey: ["public-service-offers", service, params],
    queryFn: () => publicServicesService.getOffers(service, params),
    staleTime: 60 * 1000,
    select: (response) => ({
      items: response.data,
      page: response.page,
      limit: response.limit,
      total: response.total,
      pages: response.pages,
    }),
  });
}
