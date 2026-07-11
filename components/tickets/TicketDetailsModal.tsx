"use client";

import { Button } from "@/components/ui/button";
import type { Ticket } from "@/shared/types/ticket";
import { useTranslations } from "next-intl";

type TicketDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  isPending: boolean;
  isError: boolean;
  ticket?: Ticket;
  eventNameById: Record<string, string>;
  ticketTypeNameById: Record<string, string>;
  userNameById: Record<string, string>;
};

export default function TicketDetailsModal({
  open,
  onClose,
  isPending,
  isError,
  ticket,
  eventNameById,
  ticketTypeNameById,
  userNameById,
}: TicketDetailsModalProps) {
  const t = useTranslations("tickets");
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-4xl rounded border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-xl font-extrabold text-slate-950">{t("details.title")}</h2>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </div>
        <div className="p-5">
          {isPending ? (
            <p className="text-sm text-slate-500">{t("details.loading")}</p>
          ) : isError ? (
            <p className="text-sm text-rose-600">{t("details.loadError")}</p>
          ) : ticket ? (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <DetailItem label={t("details.fields.code")} value={ticket.code} />
                <DetailItem
                  label={t("details.fields.event")}
                  value={eventNameById[ticket.eventId] ?? "Référence non trouvée"}
                />
                <DetailItem
                  label={t("details.fields.ticketType")}
                  value={ticketTypeNameById[ticket.ticketTypeId] ?? "Référence non trouvée"}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem
                  label={t("details.fields.user")}
                  value={userNameById[ticket.userId] ?? "Référence non trouvée"}
                />
                <DetailItem label={t("details.fields.status")} value={ticket.status} />
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("details.fields.qrCode")}</p>
                <div className="mt-3 flex justify-center">
                  {ticket.qrCodeUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ticket.qrCodeUrl}
                      alt={`${t("details.fields.qrCode")} ${ticket.code}`}
                      className="h-52 w-52 rounded border border-slate-200 bg-white object-contain p-2"
                    />
                  ) : (
                    <p className="text-sm text-slate-500">{t("details.qrUnavailable")}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t("details.noData")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value ?? "-"}</p>
    </div>
  );
}
