"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import {
  IconCalendar,
  IconDocument,
  IconPhone,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconWhatsApp,
} from "@/components/layout/nav-icons";
import { taskFormSchema, type TaskFormValues } from "@/lib/task-form-schema";
import { TASK_TYPE_OPTIONS } from "@/lib/tasks-api";
import { zodFormResolver } from "@/lib/zod-resolver";
import type { PipelineLead, TaskType } from "@/types";

type NewTaskModalProps = {
  open: boolean;
  leads: PipelineLead[];
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: TaskFormValues & { lead: PipelineLead }) => void;
};

function defaultDueLocal() {
  const date = new Date();
  date.setHours(15, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function NewTaskModal({
  open,
  leads,
  submitting = false,
  error = null,
  onClose,
  onSubmit,
}: NewTaskModalProps) {
  if (!open) return null;

  return (
    <NewTaskModalInner
      leads={leads}
      submitting={submitting}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function NewTaskModalInner({
  leads,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  leads: PipelineLead[];
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: TaskFormValues & { lead: PipelineLead }) => void;
}) {
  const [leadQuery, setLeadQuery] = useState("");
  const [leadMenuOpen, setLeadMenuOpen] = useState(false);
  const leadPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!leadMenuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!leadPickerRef.current?.contains(event.target as Node)) {
        setLeadMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [leadMenuOpen]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodFormResolver(taskFormSchema),
    defaultValues: {
      lead_id: "",
      task_type: "appel",
      due_at: defaultDueLocal(),
      details: "",
    },
    mode: "onChange",
  });

  const leadId = watch("lead_id");
  const dueAt = watch("due_at");
  const selectedLead = leads.find((lead) => lead.id === leadId) ?? null;

  const filteredLeads = useMemo(() => {
    const q = leadQuery.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        lead.campaign.toLowerCase().includes(q),
    );
  }, [leadQuery, leads]);

  const canSubmit = Boolean(leadId && dueAt) && !submitting;

  return (
    <Modal
      open
      size="md"
      onClose={onClose}
      title="Nouvelle tâche"
      description="Choisissez le lead concerné, le type de tâche et la date."
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => {
          const lead = leads.find((item) => item.id === values.lead_id);
          if (!lead) return;
          onSubmit({ ...values, lead });
        })}
      >
        <div>
          <p
            className="mb-1.5 text-xs font-semibold"
            style={{ color: "var(--dash-text)" }}
          >
            Lead *
          </p>
          <div className="relative" ref={leadPickerRef}>
            <span
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              style={{ color: "var(--dash-muted)" }}
            >
              <IconSearch />
            </span>
            <input
              type="search"
              value={
                leadMenuOpen
                  ? leadQuery
                  : selectedLead
                    ? `${selectedLead.name}${selectedLead.phone ? ` · ${selectedLead.phone}` : ""}`
                    : leadQuery
              }
              placeholder="Nom, téléphone ou campagne…"
              onFocus={() => {
                setLeadMenuOpen(true);
                setLeadQuery("");
              }}
              onChange={(event) => {
                setLeadMenuOpen(true);
                setLeadQuery(event.target.value);
                if (leadId) setValue("lead_id", "", { shouldValidate: true });
              }}
              className="h-10 w-full rounded-xl border pr-3 pl-9 text-sm outline-none"
              style={{
                backgroundColor: "var(--dash-field)",
                borderColor: "var(--dash-border)",
                color: "var(--dash-text)",
              }}
              aria-label="Rechercher un lead"
            />
            {leadMenuOpen ? (
              <ul
                role="listbox"
                className="absolute top-[calc(100%+6px)] left-0 z-20 max-h-48 w-full overflow-y-auto rounded-2xl border p-1.5"
                style={{
                  backgroundColor: "var(--dash-surface)",
                  borderColor: "var(--dash-border)",
                  boxShadow: "0 12px 32px rgba(28, 24, 20, 0.14)",
                }}
              >
                {filteredLeads.length === 0 ? (
                  <li
                    className="px-3 py-2 text-sm"
                    style={{ color: "var(--dash-muted)" }}
                  >
                    Aucun lead trouvé
                  </li>
                ) : (
                  filteredLeads.map((lead) => (
                    <li key={lead.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={lead.id === leadId}
                        className="filter-dropdown-item flex w-full flex-col rounded-xl px-3 py-2 text-left"
                        onClick={() => {
                          setValue("lead_id", lead.id, { shouldValidate: true });
                          setLeadQuery("");
                          setLeadMenuOpen(false);
                        }}
                      >
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--dash-text)" }}
                        >
                          {lead.name}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--dash-muted)" }}
                        >
                          {lead.phone || "Sans téléphone"}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
          <input type="hidden" {...register("lead_id")} />
          {errors.lead_id ? (
            <p className="mt-1 text-xs text-red-500">{errors.lead_id.message}</p>
          ) : null}
        </div>

        <div>
          <p
            className="mb-1.5 text-xs font-semibold"
            style={{ color: "var(--dash-text)" }}
          >
            Type
          </p>
          <Controller
            control={control}
            name="task_type"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {TASK_TYPE_OPTIONS.map((option) => {
                  const active = field.value === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => field.onChange(option.id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold"
                      style={
                        active
                          ? {
                              backgroundColor: "var(--dash-nav-active-bg)",
                              borderColor: "transparent",
                              color: "var(--dash-nav-active-text)",
                            }
                          : {
                              backgroundColor: "var(--dash-surface)",
                              borderColor: "var(--dash-border)",
                              color: "var(--dash-text)",
                            }
                      }
                    >
                      <TaskTypeIcon type={option.id} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>

        <div>
          <label
            htmlFor="task-due"
            className="mb-1.5 block text-xs font-semibold"
            style={{ color: "var(--dash-text)" }}
          >
            Date et heure *
          </label>
          <input
            id="task-due"
            type="datetime-local"
            className="h-10 w-full rounded-xl border px-3 text-sm outline-none"
            style={{
              backgroundColor: "var(--dash-field)",
              borderColor: "var(--dash-border)",
              color: "var(--dash-text)",
            }}
            {...register("due_at")}
          />
          {dueAt ? (
            <p className="mt-1 text-[11px]" style={{ color: "var(--dash-muted)" }}>
              {formatDueDisplay(dueAt)}
            </p>
          ) : null}
          {errors.due_at ? (
            <p className="mt-1 text-xs text-red-500">{errors.due_at.message}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="task-details"
            className="mb-1.5 block text-xs font-semibold"
            style={{ color: "var(--dash-text)" }}
          >
            Détails (optionnel)
          </label>
          <textarea
            id="task-details"
            rows={3}
            className="w-full resize-y rounded-xl border px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: "var(--dash-field)",
              borderColor: "var(--dash-border)",
              color: "var(--dash-text)",
            }}
            {...register("details")}
          />
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
            <IconPlus className="h-3.5 w-3.5" />
            {submitting ? "Ajout…" : "Ajouter la tâche"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TaskTypeIcon({ type }: { type: TaskType }) {
  switch (type) {
    case "appel":
      return <IconPhone />;
    case "rendez_vous":
      return <IconCalendar />;
    case "whatsapp":
      return <IconWhatsApp />;
    case "relance":
      return <IconRefresh />;
    case "devis":
      return <IconDocument />;
  }
}

function formatDueDisplay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
