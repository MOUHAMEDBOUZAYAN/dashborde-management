"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import {
  IconBell,
  IconCalendar,
  IconCampaign,
  IconCheck,
  IconClock,
  IconDocument,
  IconInfo,
  IconMail,
  IconPencil,
  IconPhone,
  IconRefresh,
  IconSend,
  IconTrash,
  IconUser,
  IconWhatsApp,
} from "@/components/layout/nav-icons";
import { formatLeadDateTimeFr, initialsFromName } from "@/lib/format-relative";
import {
  addLeadNote,
  fetchLeadActivity,
  fetchLeadNotes,
  firstContactAfterMinutes,
  getStageById,
  isStageCompleted,
  leadActivityQueryKey,
  leadNotesQueryKey,
  moveLeadToPipeline,
  PIPELINE_STAGES,
  REMINDER_ACTIONS,
  activityKindLabel,
  pipelineLeadsQueryKey,
  scheduleLeadReminder,
  updateLeadOwner,
} from "@/lib/pipeline-api";
import { fetchPipelines, pipelinesQueryKey } from "@/lib/pipelines-api";
import { readErrorMessage } from "@/lib/auth-api";
import { invalidateClientStats } from "@/lib/stats-api";
import { tasksQueryKey } from "@/lib/tasks-api";
import { useAuthStore } from "@/store/auth-store";
import type {
  LeadActivity,
  LeadActivityKind,
  Pipeline,
  PipelineLead,
  PipelineStageId,
  TaskType,
} from "@/types";

type LeadDetailTab = "informations" | "notes" | "suivi";

type LeadDetailModalProps = {
  open: boolean;
  lead: PipelineLead | null;
  /** Real assignees from API / existing leads — no mock seed list. */
  assignees?: string[];
  submitting?: boolean;
  deleting?: boolean;
  onClose: () => void;
  onStageChange: (stage: PipelineStageId) => void;
  onOwnerChange?: (owner: string) => void;
  /** Called after the lead is moved to another pipeline. */
  onPipelineChange?: (pipelineId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function LeadDetailModal({
  open,
  lead,
  assignees = [],
  submitting = false,
  deleting = false,
  onClose,
  onStageChange,
  onOwnerChange,
  onPipelineChange,
  onEdit,
  onDelete,
}: LeadDetailModalProps) {
  const queryClient = useQueryClient();
  const client = useAuthStore((state) => state.client);
  const [tab, setTab] = useState<LeadDetailTab>("informations");

  const actor =
    client?.email?.split("@")[0]?.trim() ||
    client?.company_name?.trim() ||
    "Équipe";

  useEffect(() => {
    if (open) setTab("informations");
  }, [open, lead?.id]);

  const notesQuery = useQuery({
    queryKey: leadNotesQueryKey(lead?.id ?? "none"),
    queryFn: () => fetchLeadNotes(lead!.id),
    enabled: open && Boolean(lead?.id),
  });

  const activityQuery = useQuery({
    queryKey: leadActivityQueryKey(lead?.id ?? "none"),
    queryFn: () => fetchLeadActivity(lead!.id),
    enabled: open && Boolean(lead?.id),
  });

  const pipelinesQuery = useQuery({
    queryKey: pipelinesQueryKey,
    queryFn: fetchPipelines,
    enabled: open,
  });

  const ownerMutation = useMutation({
    mutationFn: (owner: string) => updateLeadOwner(lead!.id, owner, actor),
    onSuccess: async (updated) => {
      onOwnerChange?.(updated.owner);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: pipelineLeadsQueryKey("all"),
        }),
        queryClient.invalidateQueries({
          queryKey: leadActivityQueryKey(lead!.id),
        }),
        invalidateClientStats(queryClient),
      ]);
    },
  });

  const pipelineMutation = useMutation({
    mutationFn: (pipelineId: string) =>
      moveLeadToPipeline(lead!.id, pipelineId),
    onSuccess: async (updated) => {
      onPipelineChange?.(updated.pipeline_id);
      queryClient.setQueryData<PipelineLead[]>(
        pipelineLeadsQueryKey("all"),
        (current) =>
          (current ?? []).map((item) =>
            item.id === updated.id
              ? { ...item, pipeline_id: updated.pipeline_id }
              : item,
          ),
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: pipelineLeadsQueryKey("all"),
        }),
        queryClient.invalidateQueries({
          queryKey: leadActivityQueryKey(lead!.id),
        }),
        invalidateClientStats(queryClient),
      ]);
    },
  });

  const noteMutation = useMutation({
    mutationFn: (body: string) => addLeadNote(lead!.id, body, actor),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: leadNotesQueryKey(lead!.id),
        }),
        queryClient.invalidateQueries({
          queryKey: leadActivityQueryKey(lead!.id),
        }),
        invalidateClientStats(queryClient),
      ]);
    },
  });

  const reminderMutation = useMutation({
    mutationFn: (input: {
      taskType: TaskType;
      dueAt: string;
      details?: string;
    }) =>
      scheduleLeadReminder({
        leadId: lead!.id,
        leadName: lead!.name,
        phone: lead!.phone,
        pipelineId: lead!.pipeline_id,
        taskType: input.taskType,
        dueAt: input.dueAt,
        details: input.details,
        actor,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: leadNotesQueryKey(lead!.id),
        }),
        queryClient.invalidateQueries({
          queryKey: leadActivityQueryKey(lead!.id),
        }),
        queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
        invalidateClientStats(queryClient),
      ]);
    },
  });

  const ownerError = ownerMutation.isError
    ? readErrorMessage(
        ownerMutation.error,
        "Impossible de changer le responsable.",
      )
    : null;
  const noteError = noteMutation.isError
    ? readErrorMessage(noteMutation.error, "Impossible d'ajouter la note.")
    : null;
  const reminderError = reminderMutation.isError
    ? readErrorMessage(
        reminderMutation.error,
        "Impossible de programmer le rappel.",
      )
    : null;
  const activityError = activityQuery.isError
    ? readErrorMessage(
        activityQuery.error,
        "Impossible de charger le suivi.",
      )
    : null;
  const notesError = notesQuery.isError
    ? readErrorMessage(notesQuery.error, "Impossible de charger les notes.")
    : null;
  const pipelineError = pipelineMutation.isError
    ? readErrorMessage(
        pipelineMutation.error,
        "Impossible de déplacer le lead vers ce pipeline.",
      )
    : null;

  if (!open || !lead) return null;

  const pipelines = pipelinesQuery.data ?? [];
  const currentPipeline = pipelines.find(
    (item) => item.id === lead.pipeline_id,
  );

  const stage = getStageById(lead.stage);
  const dateLabel = formatLeadDateTimeFr(lead.date);
  const initials = initialsFromName(lead.name);
  const phoneHref = lead.phone
    ? `tel:${lead.phone.replace(/\s+/g, "")}`
    : undefined;
  const whatsappHref = lead.phone
    ? `https://wa.me/${lead.phone.replace(/[^\d+]/g, "").replace(/^\+/, "")}`
    : undefined;
  const emailHref = lead.email ? `mailto:${lead.email}` : undefined;
  const activities = activityQuery.data ?? [];
  const notes = notesQuery.data ?? [];
  const contactMinutes = firstContactAfterMinutes(lead, activities);

  const pillClass =
    "inline-flex items-center gap-1.5 shrink-0 rounded-full border px-2.5 py-0.5 text-xs";

  return (
    <Modal
      open
      bare
      size="xl"
      title={lead.name}
      onClose={onClose}
      panelClassName="flex h-[88vh] max-h-[88vh] flex-col overflow-hidden"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className="relative shrink-0 border-b px-6 pt-6 sm:px-8"
          style={{
            borderColor: "var(--dash-border)",
            background:
              "linear-gradient(to bottom, color-mix(in srgb, var(--dash-gold-muted) 8%, transparent), transparent)",
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in srgb, var(--dash-gold-muted) 70%, transparent), transparent)",
            }}
          />

          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-sm"
            style={{ color: "var(--dash-muted)" }}
          >
            ×
          </button>

          <div className="flex items-start gap-4 pe-10">
            <span
              className="dash-display inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold"
              style={{
                backgroundColor: "var(--dash-nav-active-bg)",
                color: "var(--dash-nav-active-text)",
                boxShadow:
                  "0 0 0 2px color-mix(in srgb, var(--dash-gold-muted) 50%, transparent), 0 0 0 4px var(--dash-surface)",
              }}
              aria-hidden
            >
              {initials}
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="dash-display truncate text-3xl font-semibold leading-tight">
                {lead.name}
              </h2>

              <div
                className="mt-2 flex flex-wrap items-center gap-2 text-xs"
                style={{ color: "var(--dash-muted)" }}
              >
                <span
                  className={pillClass}
                  style={{
                    borderColor: "var(--dash-border)",
                    backgroundColor:
                      "color-mix(in srgb, var(--dash-surface) 70%, transparent)",
                    color: "var(--dash-text)",
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: stage?.color ?? "#a78bfa" }}
                    aria-hidden
                  />
                  {stage?.label ?? lead.stage}
                </span>

                {pipelines.length > 1 && currentPipeline ? (
                  <span
                    className={pillClass}
                    style={{
                      borderColor: "var(--dash-border)",
                      backgroundColor:
                        "color-mix(in srgb, var(--dash-surface) 70%, transparent)",
                      color: "var(--dash-text)",
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: currentPipeline.color }}
                      aria-hidden
                    />
                    {currentPipeline.name}
                  </span>
                ) : null}

                {lead.campaign ? (
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <IconCampaign className="h-3.5 w-3.5 shrink-0" />
                    <span className="max-w-[14rem] truncate">{lead.campaign}</span>
                  </span>
                ) : null}

                {dateLabel ? (
                  <span className="inline-flex items-center gap-1.5">
                    <IconClock className="h-3.5 w-3.5 shrink-0" />
                    {dateLabel}
                  </span>
                ) : null}
              </div>
            </div>

            {lead.estimated_value != null && lead.estimated_value > 0 ? (
              <div className="hidden shrink-0 text-end sm:block">
                <p
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: "var(--dash-muted)" }}
                >
                  Valeur estimée
                </p>
                <p
                  className="dash-display text-2xl font-semibold"
                  style={{ color: "var(--dash-gold-muted)" }}
                >
                  {lead.estimated_value.toLocaleString("fr-FR")}{" "}
                  <span
                    className="font-sans text-xs"
                    style={{ color: "var(--dash-muted)" }}
                  >
                    MAD
                  </span>
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <ActionPill
              href={phoneHref}
              primary
              disabled={!phoneHref}
              icon={<IconPhone className="h-4 w-4" />}
              label="Appeler"
            />
            <ActionPill
              href={whatsappHref}
              disabled={!whatsappHref}
              icon={<IconWhatsApp className="h-4 w-4" />}
              label="WhatsApp"
              external
            />
            <ActionPill
              href={emailHref}
              disabled={!emailHref}
              icon={<IconMail className="h-4 w-4" />}
              label="Email"
            />
          </div>

          <div
            className="mt-5 flex gap-7 border-b"
            style={{ borderColor: "var(--dash-border)" }}
            role="tablist"
            aria-label="Sections du lead"
          >
            <TabButton
              active={tab === "informations"}
              icon={<IconInfo className="h-4 w-4" />}
              label="Informations"
              onClick={() => setTab("informations")}
            />
            <TabButton
              active={tab === "notes"}
              icon={<IconDocument className="h-4 w-4" />}
              label="Notes"
              badge={notes.length > 0 ? notes.length : undefined}
              onClick={() => setTab("notes")}
            />
            <TabButton
              active={tab === "suivi"}
              icon={<IconRefresh className="h-4 w-4" />}
              label="Suivi"
              onClick={() => setTab("suivi")}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-7 sm:px-8">
          {tab === "informations" ? (
            <>
              <InformationsTab
                lead={lead}
                dateLabel={dateLabel}
                pipelines={pipelines}
                submitting={submitting || pipelineMutation.isPending}
                pipelineBusy={pipelineMutation.isPending}
                pipelineError={pipelineError}
                onStageChange={onStageChange}
                onPipelineChange={(pipelineId) => {
                  if (pipelineId === lead.pipeline_id) return;
                  pipelineMutation.mutate(pipelineId);
                }}
              />
              {onEdit || onDelete ? (
                <div
                  className="flex flex-wrap items-center gap-4 border-t pt-4"
                  style={{ borderColor: "var(--dash-border)" }}
                >
                  {onEdit ? (
                    <button
                      type="button"
                      disabled={deleting || submitting}
                      onClick={onEdit}
                      className="inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                      style={{ color: "var(--dash-text)" }}
                    >
                      <IconPencil className="h-4 w-4" />
                      Modifier le lead
                    </button>
                  ) : null}
                  {onDelete ? (
                    <button
                      type="button"
                      disabled={deleting || submitting}
                      onClick={onDelete}
                      className="inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                      style={{ color: "var(--dash-danger)" }}
                    >
                      <IconTrash className="h-4 w-4" />
                      {deleting ? "Suppression…" : "Supprimer le lead"}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          {tab === "notes" ? (
            <NotesTab
              lead={lead}
              assignees={assignees}
              notes={notes}
              contactMinutes={contactMinutes}
              ownerBusy={ownerMutation.isPending}
              ownerError={ownerError}
              noteBusy={noteMutation.isPending}
              noteError={noteError}
              notesError={notesError}
              reminderBusy={reminderMutation.isPending}
              reminderError={reminderError}
              onOwnerChange={(owner) => ownerMutation.mutate(owner)}
              onAddNote={(body) => noteMutation.mutateAsync(body)}
              onScheduleReminder={(input) =>
                reminderMutation.mutateAsync(input)
              }
            />
          ) : null}

          {tab === "suivi" ? (
            <SuiviTab
              loading={activityQuery.isLoading}
              error={activityError}
              activities={activities}
            />
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function InformationsTab({
  lead,
  dateLabel,
  pipelines,
  submitting,
  pipelineBusy,
  pipelineError,
  onStageChange,
  onPipelineChange,
}: {
  lead: PipelineLead;
  dateLabel: string;
  pipelines: Pipeline[];
  submitting: boolean;
  pipelineBusy: boolean;
  pipelineError: string | null;
  onStageChange: (stage: PipelineStageId) => void;
  onPipelineChange: (pipelineId: string) => void;
}) {
  const currentPipeline = pipelines.find((item) => item.id === lead.pipeline_id);
  const showPipelineSelect = pipelines.length > 1;

  return (
    <div className="space-y-8">
      {showPipelineSelect ? (
        <section>
          <h3
            className="mb-3 text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--dash-muted)" }}
          >
            Pipeline
          </h3>
          <div className="flex items-center gap-2.5">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{
                backgroundColor: currentPipeline?.color ?? "var(--dash-gold-muted)",
              }}
              aria-hidden
            />
            <select
              value={lead.pipeline_id}
              disabled={pipelineBusy || submitting}
              onChange={(event) => onPipelineChange(event.target.value)}
              className="h-10 w-full rounded-md border px-3 text-sm outline-none disabled:opacity-60"
              style={{
                borderColor: "var(--dash-border)",
                backgroundColor: "var(--dash-surface)",
                color: "var(--dash-text)",
              }}
              aria-label="Déplacer vers un autre pipeline"
            >
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          </div>
          {pipelineError ? (
            <p className="mt-2 text-sm" style={{ color: "#f87171" }} role="alert">
              {pipelineError}
            </p>
          ) : null}
        </section>
      ) : null}

      <section>
        <h3
          className="mb-3 text-[11px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--dash-muted)" }}
        >
          Entonnoir
        </h3>
        <ol className="grid grid-cols-4 gap-1.5">
          {PIPELINE_STAGES.map((item) => {
            const active = lead.stage === item.id;
            const completed =
              isStageCompleted(item.id, lead.stage) && lead.stage !== "perdu";
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={submitting}
                  aria-pressed={active}
                  onClick={() => onStageChange(item.id)}
                  className="flex h-full w-full flex-col items-center rounded-md border px-1.5 py-2 text-center transition-colors disabled:opacity-60"
                  style={{
                    backgroundColor:
                      active || completed
                        ? `color-mix(in srgb, ${item.color} ${active ? "22%" : "10%"}, transparent)`
                        : "transparent",
                    borderColor: active ? item.color : "var(--dash-border)",
                    color: active ? "var(--dash-text)" : "var(--dash-muted)",
                  }}
                >
                  <span className="mb-1 flex justify-center">
                    {completed && !active ? (
                      <span style={{ color: item.color }}>
                        <IconCheck className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: item.color,
                          opacity: active ? 1 : 0.45,
                        }}
                        aria-hidden
                      />
                    )}
                  </span>
                  <span
                    className={`block text-[11px] leading-tight ${
                      active ? "font-semibold" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <h3
          className="mb-3 text-[11px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--dash-muted)" }}
        >
          Coordonnées
        </h3>
        <div
          className="overflow-hidden rounded-lg border px-4"
          style={{
            borderColor: "var(--dash-border)",
            backgroundColor: "var(--dash-surface)",
          }}
        >
          {lead.phone ? (
            <CoordRow
              icon={<IconPhone className="h-4 w-4" />}
              label="Téléphone"
              value={lead.phone}
            />
          ) : null}
          {lead.email ? (
            <CoordRow
              icon={<IconMail className="h-4 w-4" />}
              label="Email"
              value={lead.email}
            />
          ) : null}
          <CoordRow
            icon={<IconCampaign className="h-4 w-4" />}
            label="Campagne"
            value={lead.campaign || "—"}
          />
          <CoordRow
            icon={<IconCalendar className="h-4 w-4" />}
            label="Reçu le"
            value={dateLabel || "—"}
            last={!(lead.estimated_value != null && lead.estimated_value > 0)}
          />
          {lead.estimated_value != null && lead.estimated_value > 0 ? (
            <CoordRow
              icon={<IconDocument className="h-4 w-4" />}
              label="Valeur estimée"
              value={`${lead.estimated_value.toLocaleString("fr-FR")} MAD`}
              last
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function NotesTab({
  lead,
  assignees,
  notes,
  contactMinutes,
  ownerBusy,
  ownerError,
  noteBusy,
  noteError,
  notesError,
  reminderBusy,
  reminderError,
  onOwnerChange,
  onAddNote,
  onScheduleReminder,
}: {
  lead: PipelineLead;
  assignees: string[];
  notes: { id: string; author: string; body: string; created_at: string }[];
  contactMinutes: number;
  ownerBusy: boolean;
  ownerError: string | null;
  noteBusy: boolean;
  noteError: string | null;
  notesError: string | null;
  reminderBusy: boolean;
  reminderError: string | null;
  onOwnerChange: (owner: string) => void;
  onAddNote: (body: string) => Promise<unknown>;
  onScheduleReminder: (input: {
    taskType: TaskType;
    dueAt: string;
    details?: string;
  }) => Promise<unknown>;
}) {
  const [noteBody, setNoteBody] = useState("");
  const [reminderType, setReminderType] = useState<TaskType>("appel");
  const [reminderDetail, setReminderDetail] = useState("");
  const [dueLocal, setDueLocal] = useState(() => defaultDueLocal());

  useEffect(() => {
    setNoteBody("");
    setReminderType("appel");
    setReminderDetail("");
    setDueLocal(defaultDueLocal());
  }, [lead.id]);

  async function handleAddNote() {
    const body = noteBody.trim();
    if (!body || noteBusy) return;
    await onAddNote(body);
    setNoteBody("");
  }

  async function handleSchedule() {
    const iso = localInputToIso(dueLocal);
    if (!iso || reminderBusy) return;
    await onScheduleReminder({
      taskType: reminderType,
      dueAt: iso,
      details: reminderDetail.trim() || undefined,
    });
    setReminderDetail("");
    setDueLocal(defaultDueLocal());
  }

  return (
    <div className="space-y-8">
      <section
        className="rounded-lg border p-3"
        style={{
          borderColor: "var(--dash-border)",
          backgroundColor: "var(--dash-surface)",
        }}
      >
        <p
          className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase"
          style={{ color: "var(--dash-muted)" }}
        >
          <IconUser className="h-3.5 w-3.5" />
          Responsable
        </p>
        <label className="sr-only" htmlFor={`lead-owner-${lead.id}`}>
          Responsable
        </label>
        <select
          id={`lead-owner-${lead.id}`}
          value={lead.owner}
          disabled={ownerBusy}
          onChange={(event) => onOwnerChange(event.target.value)}
          className="h-11 w-full rounded-xl border px-3 text-sm outline-none"
          style={{
            borderColor: "var(--dash-border)",
            backgroundColor: "var(--dash-surface)",
            color: "var(--dash-text)",
          }}
        >
          <option value="">Non assigné</option>
          {assignees.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
          {lead.owner && !assignees.includes(lead.owner) ? (
            <option value={lead.owner}>{lead.owner}</option>
          ) : null}
        </select>
        {ownerError ? (
          <p className="mt-2 text-sm" style={{ color: "#f87171" }} role="alert">
            {ownerError}
          </p>
        ) : null}
        <p className="mt-2 text-xs" style={{ color: "var(--dash-muted)" }}>
          Premier contact après {contactMinutes} min.
        </p>
      </section>

      <div>
        <div
          className="rounded-lg border p-3 shadow-sm"
          style={{
            borderColor: "var(--dash-border)",
            backgroundColor: "var(--dash-surface)",
          }}
        >
          <textarea
            value={noteBody}
            onChange={(event) => setNoteBody(event.target.value)}
            rows={3}
            placeholder="Écrire une note sur ce lead…"
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                void handleAddNote();
              }
            }}
            className="w-full resize-none bg-transparent p-1 text-sm outline-none placeholder:opacity-60"
            style={{ color: "var(--dash-text)" }}
          />
          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={noteBusy || !noteBody.trim()}
              onClick={() => void handleAddNote()}
              className="inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-xs font-semibold disabled:opacity-40"
              style={{
                backgroundColor: "var(--dash-text)",
                color: "var(--dash-bg)",
              }}
            >
              <IconSend className="h-4 w-4" />
              {noteBusy ? "Ajout…" : "Ajouter la note"}
            </button>
          </div>
        </div>

        {notesError ? (
          <p className="mt-3 text-sm" style={{ color: "#f87171" }} role="alert">
            {notesError}
          </p>
        ) : null}
        {noteError ? (
          <p className="mt-3 text-sm" style={{ color: "#f87171" }} role="alert">
            {noteError}
          </p>
        ) : null}

        {notes.length === 0 && !notesError ? (
          <p className="mt-4 text-sm" style={{ color: "var(--dash-muted)" }}>
            Aucune note pour le moment.
          </p>
        ) : notes.length > 0 ? (
          <ul className="mt-5 space-y-4">
            {notes.map((note) => (
              <li key={note.id} className="flex gap-3">
                <span
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                  style={{
                    backgroundColor: "var(--dash-nav-active-bg)",
                    color: "var(--dash-nav-active-text)",
                  }}
                >
                  {initialsFromName(note.author || "?")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--dash-text)" }}
                    >
                      {note.author || "Équipe"}
                    </span>{" "}
                    · {formatLeadDateTimeFr(note.created_at)}
                  </p>
                  <p
                    className="mt-1.5 rounded-lg rounded-ss-none border px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap"
                    style={{
                      borderColor: "var(--dash-border)",
                      backgroundColor:
                        "color-mix(in srgb, var(--dash-muted) 12%, transparent)",
                      color: "var(--dash-text)",
                    }}
                  >
                    {note.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <section
        className="space-y-4 rounded-xl border p-4 shadow-sm"
        style={{
          borderColor: "var(--dash-border)",
          backgroundColor: "var(--dash-surface)",
        }}
      >
        <p
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "var(--dash-text)" }}
        >
          <IconBell className="h-4 w-4" />
          Me rappeler de...
        </p>

        <div className="flex flex-wrap gap-2">
          {REMINDER_ACTIONS.map((action) => {
            const active = reminderType === action.id;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => setReminderType(action.id)}
                className="inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium"
                style={
                  active
                    ? {
                        backgroundColor: "var(--dash-text)",
                        borderColor: "transparent",
                        color: "var(--dash-bg)",
                      }
                    : {
                        backgroundColor: "transparent",
                        borderColor: "var(--dash-border)",
                        color: "var(--dash-text)",
                      }
                }
              >
                {action.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="datetime-local"
            value={dueLocal}
            onChange={(event) => setDueLocal(event.target.value)}
            className="h-11 min-w-0 flex-1 rounded-xl border px-3 text-sm outline-none"
            style={{
              borderColor: "var(--dash-border)",
              backgroundColor: "var(--dash-surface)",
              color: "var(--dash-text)",
              colorScheme: "dark",
            }}
          />
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["Aujourd'hui", 0],
                ["Demain", 1],
                ["+3 jours", 3],
              ] as const
            ).map(([label, days]) => (
              <button
                key={label}
                type="button"
                onClick={() => setDueLocal(dueLocalFromOffset(days))}
                className="inline-flex h-8 items-center rounded-full border px-2.5 text-[11px] font-medium"
                style={{
                  borderColor: "var(--dash-border)",
                  color: "var(--dash-text)",
                  backgroundColor: "var(--dash-surface)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-3 block">
          <span className="sr-only">Détail (optionnel)</span>
          <input
            value={reminderDetail}
            onChange={(event) => setReminderDetail(event.target.value)}
            placeholder="Détail (optionnel)"
            className="h-11 w-full rounded-xl border px-3 text-sm outline-none placeholder:opacity-60"
            style={{
              borderColor: "var(--dash-border)",
              backgroundColor: "var(--dash-surface)",
              color: "var(--dash-text)",
            }}
          />
        </label>

        {reminderError ? (
          <p className="mt-3 text-sm" style={{ color: "#f87171" }} role="alert">
            {reminderError}
          </p>
        ) : null}

        <button
          type="button"
          disabled={reminderBusy || !dueLocal}
          onClick={() => void handleSchedule()}
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold disabled:opacity-50"
          style={{
            backgroundColor: "var(--dash-text)",
            color: "var(--dash-bg)",
          }}
        >
          <IconBell className="h-4 w-4" />
          {reminderBusy ? "Programmation…" : "Programmer le rappel"}
        </button>
      </section>
    </div>
  );
}

function activityKindIcon(kind: LeadActivityKind) {
  switch (kind) {
    case "received":
      return <IconCampaign className="h-3.5 w-3.5" />;
    case "stage_change":
      return <IconRefresh className="h-3.5 w-3.5" />;
    case "note":
      return <IconDocument className="h-3.5 w-3.5" />;
    case "reminder":
      return <IconBell className="h-3.5 w-3.5" />;
    case "owner_change":
      return <IconUser className="h-3.5 w-3.5" />;
    default:
      return <IconInfo className="h-3.5 w-3.5" />;
  }
}

function SuiviTab({
  loading,
  error,
  activities,
}: {
  loading: boolean;
  error: string | null;
  activities: LeadActivity[];
}) {
  if (loading) {
    return (
      <p className="py-10 text-center text-sm" style={{ color: "var(--dash-muted)" }}>
        Chargement du suivi…
      </p>
    );
  }

  if (error) {
    return (
      <p className="py-10 text-center text-sm" style={{ color: "#f87171" }} role="alert">
        {error}
      </p>
    );
  }

  return (
    <div>
      <div
        className="mb-1 flex items-center gap-2 text-sm font-semibold"
        style={{ color: "var(--dash-text)" }}
      >
        <span style={{ color: "var(--dash-gold-muted)" }}>
          <IconRefresh className="h-4 w-4" />
        </span>
        Suivi des actions
      </div>
      <p className="mb-5 text-xs" style={{ color: "var(--dash-muted)" }}>
        Tout ce qui a été fait sur ce lead, par qui et quand.
      </p>

      {activities.length === 0 ? (
        <p
          className="rounded-xl border px-4 py-8 text-center text-sm"
          style={{
            borderColor: "var(--dash-border)",
            backgroundColor: "var(--dash-surface)",
            color: "var(--dash-muted)",
          }}
        >
          Aucune action pour le moment.
        </p>
      ) : (
        <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:start-[13px] before:w-px before:bg-[var(--dash-border)]">
          {activities.map((activity) => (
            <li key={activity.id} className="relative flex gap-3">
              <span
                className="relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                style={{
                  borderColor: "var(--dash-border)",
                  backgroundColor: "var(--dash-surface)",
                  color: "var(--dash-muted)",
                }}
                aria-hidden
                title={activityKindLabel(activity.kind)}
              >
                {activityKindIcon(activity.kind)}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm leading-snug">
                  <span
                    className="font-medium"
                    style={{ color: "var(--dash-text)" }}
                  >
                    {activity.actor || "Équipe"}
                  </span>{" "}
                  <span style={{ color: "var(--dash-muted)" }}>
                    {activity.message}
                  </span>
                </p>
                {activity.detail ? (
                  <p
                    className="mt-0.5 line-clamp-2 text-xs break-words"
                    style={{ color: "var(--dash-muted)" }}
                  >
                    {activity.detail}
                  </p>
                ) : null}
                <p
                  className="mt-0.5 text-[11px]"
                  style={{ color: "var(--dash-muted)", opacity: 0.85 }}
                >
                  {formatLeadDateTimeFr(activity.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ActionPill({
  href,
  label,
  icon,
  primary = false,
  disabled = false,
  external = false,
}: {
  href?: string;
  label: string;
  icon: ReactNode;
  primary?: boolean;
  disabled?: boolean;
  external?: boolean;
}) {
  const className =
    "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-opacity disabled:opacity-40";
  const style = primary
    ? {
        backgroundColor: "var(--dash-text)",
        borderColor: "transparent",
        color: "var(--dash-bg)",
      }
    : {
        backgroundColor: "transparent",
        borderColor: "var(--dash-border)",
        color: "var(--dash-text)",
      };

  if (!href || disabled) {
    return (
      <button type="button" disabled className={className} style={style}>
        {icon}
        {label}
      </button>
    );
  }

  return (
    <a
      href={href}
      className={className}
      style={style}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      {icon}
      {label}
    </a>
  );
}

function TabButton({
  active,
  label,
  icon,
  badge,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="-mb-px inline-flex items-center gap-2 border-b-2 bg-transparent px-1 pt-2 pb-3 text-[13px] font-medium transition-colors"
      style={{
        borderColor: active ? "var(--dash-gold-muted)" : "transparent",
        color: active ? "var(--dash-text)" : "var(--dash-muted)",
      }}
    >
      {icon}
      {label}
      {badge != null ? (
        <span
          className="rounded-full px-1.5 text-[11px] font-semibold"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--dash-gold-muted) 18%, transparent)",
            color: "var(--dash-text)",
          }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function CoordRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-start gap-3 py-2.5"
      style={{
        borderBottom: last ? undefined : "1px solid var(--dash-border)",
      }}
    >
      <span className="mt-0.5" style={{ color: "var(--dash-muted)" }} aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
          {label}
        </p>
        <p
          className="text-sm font-medium break-words"
          style={{ color: "var(--dash-text)" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultDueLocal() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(17, 0, 0, 0);
  return toLocalInputValue(date);
}

function dueLocalFromOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(17, 0, 0, 0);
  return toLocalInputValue(date);
}

function localInputToIso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
