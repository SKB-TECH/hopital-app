import { useQuery } from "@tanstack/react-query";
import { eventService } from "@/shared/services/event.service";

export function useEvents() {
    return useQuery({
        queryKey: ["events", "list"],
        queryFn: () => eventService.listEvents({ page: 1, limit: 100 }),
    });
}
