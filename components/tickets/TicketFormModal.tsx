"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Autocomplete, { type AutocompleteOption } from "@/components/ui/autocomplete";
import { useTranslations } from "next-intl";
import {
  ticketInitialValues,
  validateTicketPayload,
  type TicketFormErrors,
  type TicketFormValues,
} from "@/shared/schemas/ticket.schema";
import type { CreateTicketPayload, Ticket } from "@/shared/types/ticket";

type TicketFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTicketPayload) => Promise<void> | void;
  isPending?: boolean;
  mode?: "create" | "edit";
  initialTicket?: Ticket | null;
  eventOptions?: AutocompleteOption[];
  ticketTypeOptions?: AutocompleteOption[];
  connectedUser?: AutocompleteOption | null;
  isEventsLoading?: boolean;
  isTypeTicketsLoading?: boolean;
};

function normalizeFormValues(ticket?: Ticket | null): TicketFormValues {
  if (!ticket) {
    return ticketInitialValues;
  }

  return {
    eventId: ticket.eventId ?? "",
    ticketTypeId: ticket.ticketTypeId ?? "",
    userId: ticket.userId ?? "",
  };
}

export default function TicketFormModal({
  open,
  onClose,
  onSubmit,
  isPending = false,
  mode = "create",
  initialTicket,
  eventOptions = [],
  ticketTypeOptions = [],
  connectedUser = null,
  isEventsLoading = false,
  isTypeTicketsLoading = false,
}: TicketFormModalProps) {
  const t = useTranslations("tickets");
  const [values, setValues] = useState<TicketFormValues>(ticketInitialValues);
  const [errors, setErrors] = useState<TicketFormErrors>({});

  const title = useMemo(
    () => (mode === "create" ? t("form.createTitle") : t("form.editTitle")),
    [mode, t]
  );

  useEffect(() => {
    if (!open) return;
    const nextValues = normalizeFormValues(initialTicket);

    if (mode === "create") {
      nextValues.userId = connectedUser?.id ?? "";
    }

    setValues(nextValues);
    setErrors({});
  }, [open, initialTicket, mode, connectedUser]);

  if (!open) return null;

  const setField = (field: keyof TicketFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextValues: TicketFormValues = {
      ...values,
      eventId: values.eventId.trim(),
      ticketTypeId: values.ticketTypeId.trim(),
      userId: values.userId.trim(),
    };

    const validationErrors = validateTicketPayload(nextValues);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    await onSubmit(nextValues as CreateTicketPayload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-2xl overflow-visible rounded border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("form.labels.event")} required error={errors.eventId}>
              <Autocomplete
                value={values.eventId}
                placeholder={t("form.placeholders.event")}
                options={eventOptions}
                isLoading={isEventsLoading}
                emptyText={t("form.empty.event")}
                showIdFallback={false}
                onSelect={(option) => {
                  setField("eventId", option.id);
                }}
              />
            </Field>

            <Field label={t("form.labels.ticketType")} required error={errors.ticketTypeId}>
              <Autocomplete
                value={values.ticketTypeId}
                placeholder={t("form.placeholders.ticketType")}
                options={ticketTypeOptions}
                isLoading={isTypeTicketsLoading}
                emptyText={t("form.empty.ticketType")}
                showIdFallback={false}
                onSelect={(option) => {
                  setField("ticketTypeId", option.id);
                }}
              />
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
              {isPending
                ? t("common.saving")
                : mode === "create"
                  ? t("form.submitCreate")
                  : t("form.submitEdit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
