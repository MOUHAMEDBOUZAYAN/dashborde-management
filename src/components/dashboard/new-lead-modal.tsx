"use client";

import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import { IconPencil, IconPlus } from "@/components/layout/nav-icons";
import { leadFormSchema, type LeadFormValues } from "@/lib/lead-form-schema";
import { zodFormResolver } from "@/lib/zod-resolver";
import type { PipelineLead } from "@/types";

type NewLeadModalProps = {
  open: boolean;
  /** When set, the modal edits this lead instead of creating one. */
  lead?: PipelineLead | null;
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: LeadFormValues) => void;
};

export function NewLeadModal({
  open,
  lead = null,
  submitting = false,
  error = null,
  onClose,
  onSubmit,
}: NewLeadModalProps) {
  if (!open) return null;

  return (
    <NewLeadModalInner
      key={lead?.id ?? "new"}
      lead={lead}
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function NewLeadModalInner({
  lead,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  lead: PipelineLead | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: LeadFormValues) => void;
}) {
  const isEdit = Boolean(lead);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodFormResolver(leadFormSchema),
    defaultValues: {
      name: lead?.name ?? "",
      phone: lead?.phone ?? "",
      email: lead?.email ?? "",
      campaign: lead?.campaign ?? "",
      estimated_value:
        lead?.estimated_value != null ? String(lead.estimated_value) : "",
    },
    mode: "onChange",
  });

  const name = watch("name");
  const canSubmit = name.trim().length > 0 && !submitting;

  return (
    <Modal
      open
      size="md"
      onClose={onClose}
      title={isEdit ? "Modifier le lead" : "Nouveau lead"}
      description={
        isEdit
          ? "Mettez à jour les informations de ce contact."
          : "Ajoutez un contact à la main. Il arrive en « Nouveau » avec une tâche d'appel pour aujourd'hui."
      }
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => onSubmit(values))}
      >
        <Field id="lead-name" label="Nom *" error={errors.name?.message}>
          <input
            id="lead-name"
            autoComplete="name"
            className={fieldClassName}
            style={fieldStyle}
            {...register("name")}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="lead-phone" label="Téléphone" error={errors.phone?.message}>
            <input
              id="lead-phone"
              type="tel"
              autoComplete="tel"
              className={fieldClassName}
              style={fieldStyle}
              {...register("phone")}
            />
          </Field>
          <Field id="lead-email" label="Email" error={errors.email?.message}>
            <input
              id="lead-email"
              type="email"
              autoComplete="email"
              className={fieldClassName}
              style={fieldStyle}
              {...register("email")}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="lead-campaign"
            label="Campagne"
            error={errors.campaign?.message}
          >
            <input
              id="lead-campaign"
              className={fieldClassName}
              style={fieldStyle}
              {...register("campaign")}
            />
          </Field>
          <Field
            id="lead-value"
            label="Valeur estimée (MAD)"
            error={errors.estimated_value?.message}
          >
            <input
              id="lead-value"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              className={fieldClassName}
              style={fieldStyle}
              {...register("estimated_value")}
            />
          </Field>
        </div>

        {error ? (
          <p className="text-sm" style={{ color: "#f87171" }} role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-medium disabled:opacity-50"
            style={{
              borderColor: "var(--dash-border)",
              backgroundColor: "var(--dash-surface)",
              color: "var(--dash-text)",
            }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
            style={{
              backgroundColor: "var(--login-cream)",
              color: "#1c1814",
            }}
          >
            {isEdit ? (
              <IconPencil className="h-3.5 w-3.5" />
            ) : (
              <IconPlus className="h-3.5 w-3.5" />
            )}
            {submitting
              ? isEdit
                ? "Enregistrement…"
                : "Ajout…"
              : isEdit
                ? "Enregistrer"
                : "Ajouter le lead"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold"
        style={{ color: "var(--dash-text)" }}
      >
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

const fieldClassName =
  "h-10 w-full rounded-xl border px-3 text-sm outline-none";

const fieldStyle = {
  backgroundColor: "var(--dash-field)",
  borderColor: "var(--dash-border)",
  color: "var(--dash-text)",
} as const;
