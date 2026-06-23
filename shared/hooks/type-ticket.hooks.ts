import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { typeTicketService } from "@/shared/services/type-ticket";
import type { CreateTypeTicketPayload } from "@/shared/types/type-ticket";

const TYPE_TICKET_QUERY_KEY = ["ticket-types"] as const;

export function useTypeTickets() {
  return useQuery({
    queryKey: TYPE_TICKET_QUERY_KEY,
    queryFn: () => typeTicketService.getTypeTickets(),
  });
}

export function useCreateTypeTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTypeTicketPayload) => typeTicketService.createTypeTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TYPE_TICKET_QUERY_KEY });
    },
  });
}
