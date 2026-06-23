"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, CircleDollarSign, Plus, Ticket as TicketIcon } from "lucide-react";
import { toast } from "sonner";
import { useSidebar } from "@/contexts/SidebarContext";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TicketTable from "@/components/tickets/TicketTable";
import TicketFormModal from "@/components/tickets/TicketFormModal";
import TicketDetailsModal from "@/components/tickets/TicketDetailsModal";
import SummaryCards from "@/components/tickets/SummaryCards";
import {
  useCreateTicket,
  useDeleteTicket,
  useTicket,
  useTickets,
  useUpdateTicket,
} from "@/shared/hooks/ticket.hooks.";
import { useEvents } from "@/shared/hooks/event.hooks";
import { useTypeTickets } from "@/shared/hooks/type-ticket.hooks";
import type { CreateTicketPayload, Ticket } from "@/shared/types/ticket";
import MetricCard from "@/components/MetricCard";
import { useTranslations } from "next-intl";
import { useMe } from "@/shared/hooks/auth.hooks";
import type { AutocompleteOption } from "@/components/ui/autocomplete";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/shared/lib/http/api";

export default function TicketsPage() {
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [userNameById, setUserNameById] = useState<Record<string, string>>({});

  type UserLabelItem = { id: string; label: string };

  const ticketsQuery = useTickets();
  const eventsQuery = useEvents();
  const typeTicketsQuery = useTypeTickets();
  const createTicketMutation = useCreateTicket();
  const updateTicketMutation = useUpdateTicket();
  const deleteTicketMutation = useDeleteTicket();
  const selectedTicketQuery = useTicket(selectedTicketId ?? undefined);
  const meQuery = useMe();

  const tickets = ticketsQuery.data?.items ?? [];

  const metrics = useMemo(() => {
    const pending = tickets.filter((ticket) => ticket.status === "PENDING").length;
    const active = tickets.filter((ticket) => ticket.status === "ACTIVE").length;
    const used = tickets.filter((ticket) => ticket.status === "USED").length;
    const cancelled = tickets.filter((ticket) => ticket.status === "CANCELLED").length;

    return { total: tickets.length, pending, active, used, cancelled };
  }, [tickets]);

  const t = useTranslations("tickets");

  const eventOptions = useMemo<AutocompleteOption[]>(
    () =>
      (eventsQuery.data?.data ?? []).map((event) => ({
        id: event.id,
        label: event.title ?? event.name ?? event.id,
      })),
    [eventsQuery.data]
  );

  const eventNameById = useMemo(
    () =>
      Object.fromEntries(
        eventOptions.map((eventOption) => [eventOption.id, eventOption.label] as const)
      ),
    [eventOptions]
  );

  const ticketTypeOptions = useMemo(
    () =>
      (typeTicketsQuery.data?.items ?? []).map((item) => ({
        id: item.id,
        label: item.name,
      })),
    [typeTicketsQuery.data]
  );

  const ticketTypeNameById = useMemo(
    () =>
      Object.fromEntries(
        ticketTypeOptions.map((ticketTypeOption) => [ticketTypeOption.id, ticketTypeOption.label] as const)
      ),
    [ticketTypeOptions]
  );

  const connectedUser = meQuery.data?.id
    ? {
        id: meQuery.data.id,
        label: meQuery.data.fullName ?? meQuery.data.email ?? meQuery.data.id,
        description: meQuery.data.email ?? meQuery.data.id,
      }
    : null;

  useEffect(() => {
    let mounted = true;

    const normalizeUserRows = (rawData: any) => {
      const rows = Array.isArray(rawData?.data) ? rawData.data : Array.isArray(rawData) ? rawData : [];

      return rows
        .map((row: any) => ({
          id: row.id,
          label:
            row.fullName ??
            row.displayName ??
            row.name ??
            row.email ??
            row.phone ??
            row.id,
        }))
        .filter((row: { id: string; label: string }) => Boolean(row.id));
    };

    const loadUsers = async () => {
      try {
        const usersResponse = await api.get("/users");
        const users = normalizeUserRows(usersResponse.data) as UserLabelItem[];
        if (mounted) {
          setUserNameById(Object.fromEntries(users.map((user) => [user.id, user.label] as const)));
        }
      } catch {
        try {
          const organizersResponse = await api.get("/organizers");
          const users = normalizeUserRows(organizersResponse.data) as UserLabelItem[];
          if (mounted) {
            setUserNameById(Object.fromEntries(users.map((user) => [user.id, user.label] as const)));
          }
        } catch {
          if (mounted) setUserNameById({});
        }
      }
    };

    loadUsers().catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const handleOpenCreate = () => {
    setEditingTicket(null);
    setIsModalOpen(true);
  };

  const handleOpenCreateTicketType = () => {
    router.push("/ticket-types?create=1");
  };

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setIsModalOpen(true);
  };

  const handleView = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    setIsDetailsModalOpen(true);
  };

  const handleCreateOrUpdate = async (payload: CreateTicketPayload) => {
    try {
      if (editingTicket) {
        await updateTicketMutation.mutateAsync({
          id: editingTicket.id,
          payload,
        });

        toast.success(t("toasts.updated.title"), {
          description: t("toasts.updated.description"),
        });
      } else {
        await createTicketMutation.mutateAsync(payload);

        toast.success(t("toasts.created.title"), {
          description: t("toasts.created.description"),
        });
      }

      setIsModalOpen(false);
      setEditingTicket(null);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        t("toasts.genericError");

      toast.error(t("toasts.saveFailed.title"), {
        description: Array.isArray(message) ? message.join(", ") : message,
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTicketMutation.mutateAsync(id);
      if (selectedTicketId === id) setSelectedTicketId(null);

      toast.success(t("toasts.deleted.title"), {
        description: t("toasts.deleted.description"),
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        t("toasts.genericError");

      toast.error(t("toasts.deleteFailed.title"), {
        description: Array.isArray(message) ? message.join(", ") : message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardSidebar />

      <div className={`transition-all duration-300 ${isCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"}`}>
        <DashboardNavbar />

        <main className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-950">{t("page.title")}</h1>
              <p className="mt-1 text-sm text-slate-500">{t("page.description")}</p>
            </div>

            <Button onClick={handleOpenCreate} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="size-4" />
              {t("page.createTicket")}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={<TicketIcon className="size-5" />} title={t("metrics.ticketsSold")} value={metrics.total} trend="+10.5%" trendUp={true} />
            <MetricCard icon={<CircleDollarSign className="size-5" />} title={t("metrics.revenueGenerated")} value={metrics.pending} trend="+8.2%" trendUp={true} />
            <MetricCard icon={<TicketIcon className="size-5" />} title={t("metrics.ticketsRemaining")} value={metrics.active} trend="+12.5%" trendUp={true} />
            <MetricCard icon={<CalendarCheck className="size-5" />} title={t("metrics.checkinsCompleted")} value={metrics.used} trend="+12.5%" trendUp={true} />
          </div>
          <SummaryCards
            activeTickets={metrics.active}
            soldOutTickets={metrics.cancelled}
            totalTickets={metrics.total}
            onCreateTicketType={handleOpenCreateTicketType}
          />

          {ticketsQuery.isPending ? (
            <div className="rounded border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              {t("page.loadingTickets")}
            </div>
          ) : ticketsQuery.isError ? (
            <div className="rounded border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
              {t("page.loadTicketsError")}
            </div>
          ) : (
            <TicketTable
              tickets={tickets}
              eventNameById={eventNameById}
              ticketTypeNameById={ticketTypeNameById}
              userNameById={userNameById}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDeleting={deleteTicketMutation.isPending}
              deletingId={deleteTicketMutation.variables ?? null}
            />
          )}
        </main>
      </div>

      <TicketFormModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTicket(null);
        }}
        mode={editingTicket ? "edit" : "create"}
        initialTicket={editingTicket}
        isPending={createTicketMutation.isPending || updateTicketMutation.isPending}
        onSubmit={handleCreateOrUpdate}
        eventOptions={eventOptions}
        ticketTypeOptions={ticketTypeOptions}
        connectedUser={connectedUser}
        isEventsLoading={eventsQuery.isPending}
        isTypeTicketsLoading={typeTicketsQuery.isPending}
      />

      <TicketDetailsModal
        open={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTicketId(null);
        }}
        isPending={selectedTicketQuery.isPending}
        isError={selectedTicketQuery.isError}
        ticket={selectedTicketQuery.data}
        eventNameById={eventNameById}
        ticketTypeNameById={ticketTypeNameById}
        userNameById={userNameById}
      />
    </div>
  );
}

