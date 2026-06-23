import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ticketService } from "@/shared/services/ticket.service";
import type { CreateTicketPayload, UpdateTicketPayload } from "@/shared/types/ticket";

const TICKET_QUERY_KEY = ["tickets"] as const;

export function useTickets() {
  return useQuery({
    queryKey: TICKET_QUERY_KEY,
    queryFn: () => ticketService.getTickets(),
  });
}

export function useTicket(id?: string) {
  return useQuery({
    queryKey: [...TICKET_QUERY_KEY, id],
    queryFn: () => ticketService.getTicketById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => ticketService.createTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKET_QUERY_KEY });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTicketPayload }) =>
      ticketService.updateTicket(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TICKET_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...TICKET_QUERY_KEY, variables.id] });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ticketService.deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKET_QUERY_KEY });
    },
  });
}
