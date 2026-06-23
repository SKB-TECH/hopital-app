"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import type { Ticket } from "@/shared/types/ticket";

type TicketTableProps = {
  tickets: Ticket[];
  eventNameById?: Record<string, string>;
  ticketTypeNameById?: Record<string, string>;
  userNameById?: Record<string, string>;
  onView: (ticket: Ticket) => void;
  onEdit: (ticket: Ticket) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  deletingId?: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  USED: "bg-blue-50 text-blue-700 border-blue-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function TicketTable({
  tickets,
  eventNameById = {},
  ticketTypeNameById = {},
  userNameById = {},
  onView,
  onEdit,
  onDelete,
  isDeleting = false,
  deletingId = null,
}: TicketTableProps) {
  const t = useTranslations("tickets");

  if (tickets.length === 0) {
    return (
      <div className="rounded border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">{t("table.empty")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[980px]">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t("table.headers.index")}</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t("table.headers.code")}</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t("table.headers.event")}</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t("table.headers.ticketType")}</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t("table.headers.user")}</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{t("table.headers.status")}</th>
            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">{t("table.headers.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket, index) => (
            <tr key={ticket.id} className="group border-b border-slate-100 transition-colors hover:bg-slate-50">
              <td className="px-5 py-4 text-sm font-semibold text-slate-500">{index + 1}</td>
              <td className="px-5 py-4 text-sm font-semibold text-slate-900">{ticket.code}</td>
              <td className="px-5 py-4 text-sm text-slate-600">{eventNameById[ticket.eventId] ?? ticket.eventId}</td>
              <td className="px-5 py-4 text-sm text-slate-600">
                {ticketTypeNameById[ticket.ticketTypeId] ?? ticket.ticketTypeId}
              </td>
              <td className="px-5 py-4 text-sm text-slate-600">{userNameById[ticket.userId] ?? ticket.userId}</td>
              <td className="px-5 py-4">
                <Badge className={STATUS_STYLES[ticket.status] ?? "bg-slate-100 text-slate-700 border-slate-200"}>
                  {ticket.status}
                </Badge>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center justify-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onView(ticket)} aria-label={t("table.actions.view")}>
                    <Eye className="size-4 text-slate-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(ticket)} aria-label={t("table.actions.edit")}>
                    <Pencil className="size-4 text-slate-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(ticket.id)}
                    disabled={isDeleting && deletingId === ticket.id}
                    aria-label={t("table.actions.delete")}
                  >
                    <Trash2 className="size-4 text-rose-600" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
