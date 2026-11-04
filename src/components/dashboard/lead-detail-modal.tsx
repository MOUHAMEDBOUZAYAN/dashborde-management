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
  PIPELINE_STAGES,
  REMINDER_ACTIONS,
  activityKindLabel,
  pipelineLeadsQueryKey,
  scheduleLeadReminder,
  updateLeadOwner,
} from "@/lib/pipeline-api";
import { readErrorMessage } from "@/lib/auth-api";
import { invalidateClientStats } from "@/lib/stats-api";
import { tasksQueryKey } from "@/lib/tasks-api";
import { useAuthStore } from "@/store/auth-store";
import type {
  LeadActivity,
  LeadActivityKind,
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

  if (!open || !lead) return null;

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

  return (
    <Modal open bare size="lg" title={lead.name} onClose={onClose}>
      <div className="relative px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
        <button
          type="button"
          aria-label="Fermer"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border text-sm"
          style={{
            borderColor: "var(--dash-border)",
            color: "var(--dash-muted)",
            backgroundColor: "var(--dash-field)",
          }}
        >
          ×
        </button>

        <div className="flex items-start gap-3.5 pr-8">
          <span
            className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-bold tracking-wide"
            style={{
              backgroundColor: "var(--dash-nav-active-bg)",
              color: "var(--dash-nav-active-text)",
            }}
            aria-hidden
          >
            {initials}
          </span>

          <div className="min-w-0 flex-1">
            <h2
              className={`dash-display truncate text-xl tracking-tight sm:text-2xl`}
            >
              {lead.name}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium"
                style={{
                  borderColor: "var(--dash-border)",
                  color: "var(--dash-text)",
                  backgroundColor: "var(--dash-field)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: stage?.color ?? "#a78bfa" }}
                  aria-hidden
                />
                {stage?.label ?? lead.stage}
              </span>

              {dateLabel ? (
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{ color: "var(--dash-muted)" }}
                >
                  <IconRefresh className="h-3.5 w-3.5" />
                  <IconClock className="h-3.5 w-3.5" />
                  {dateLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <ActionPill
            href={phoneHref}
            primary
            disabled={!phoneHref}
            icon={<IconPhone className="h-3.5 w-3.5" />}
            label="Appeler"
          />
          <ActionPill
            href={whatsappHref}
            disabled={!whatsappHref}
            icon={<IconWhatsApp className="h-3.5 w-3.5" />}
            label="WhatsApp"
            external
          />
          <ActionPill
            href={emailHref}
            disabled={!emailHref}
            icon={<IconMail className="h-3.5 w-3.5" />}
            label="Email"
          />
        </div>

        <div
          className="mt-5 flex gap-1 border-b"
          style={{ borderColor: "var(--dash-border)" }}
          role="tablist"
          aria-label="Sections du lead"
        >
          <TabButton
            active={tab === "informations"}
            icon={<IconInfo className="h-3.5 w-3.5" />}
            label="Informations"
            onClick={() => setTab("informations")}
          />
          <TabButton
            active={tab === "notes"}
            icon={<IconDocument className="h-3.5 w-3.5" />}
            label="Notes"
            onClick={() => setTab("notes")}
          />
          <TabButton
            active={tab === "suivi"}
            icon={<IconClock className="h-3.5 w-3.5" />}
            label="Suivi"
            onClick={() => setTab("suivi")}
          />
        </div>
      </div>

      <div className="space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
        {tab === "informations" ? (
          <InformationsTab
            lead={lead}
            dateLabel={dateLabel}
            submitting={submitting}
            onStageChange={onStageChange}
          />
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

        {tab === "informations" && (onEdit || onDelete) ? (
          <div className="flex flex-wrap items-center gap-4">
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
                style={{ color: "#ef4444" }}
              >
                <IconTrash className="h-4 w-4" />
                {deleting ? "Suppression…" : "Supprimer le lead"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function InformationsTab({
  lead,
  dateLabel,
  submitting,
  onStageChange,
}: {
  lead: PipelineLead;
  dateLabel: string;
  submitting: boolean;
  onStageChange: (stage: PipelineStageId) => void;
}) {
  return (
    <>
      <section>
        <p
          className="mb-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
          style={{ color: "var(--dash-muted)" }}
        >
          Entonnoir
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PIPELINE_STAGES.map((item) => {
            const active = lead.stage === item.id;
            const completed = isStageCompleted(item.id, lead.stage);
            return (
              <button
                key={item.id}
                type="button"
                disabled={submitting}
                aria-pressed={active}
                aria-label={
                  completed
                    ? `${item.label} (terminé)`
                    : active
                      ? `${item.label} (actuel)`
                      : item.label
                }
                onClick={() => onStageChange(item.id)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border px-2.5 text-left text-xs font-medium transition-colors disabled:opacity-60"
                style={
                  active
                    ? {
                        backgroundColor: `color-mix(in srgb, ${item.color} 14%, var(--dash-surface))`,
                        borderColor: item.color,
                        color: "var(--dash-text)",
                        boxShadow: `0 0 0 1px color-mix(in srgb, ${item.color} 35%, transparent)`,
                      }
                    : completed
                      ? {
                          backgroundColor: `color-mix(in srgb, ${item.color} 10%, var(--dash-field))`,
                          borderColor: `color-mix(in srgb, ${item.color} 55%, var(--dash-border))`,
                          color: "var(--dash-muted)",
                        }
                      : {
                          backgroundColor: "var(--dash-field)",
                          borderColor: "var(--dash-border)",
                          color: "var(--dash-text)",
                        }
                }
              >
                {completed && !active ? (
                  <span
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${item.color} 22%, transparent)`,
                      color: item.color,
                    }}
                    aria-hidden
                  >
                    <IconCheck className="h-2.5 w-2.5" />
                  </span>
                ) : (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden
                  />
                )}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p
          className="mb-2.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
          style={{ color: "var(--dash-muted)" }}
        >
          Coordonnées
        </p>
        <div
          className="overflow-hidden rounded-2xl border"
          style={{
            borderColor: "var(--dash-border)",
            backgroundColor: "var(--dash-field)",
          }}
        >
          <CoordRow
            icon={<IconPhone className="h-4 w-4" />}
            label="Téléphone"
            value={lead.phone || "—"}
          />
          <CoordRow
            icon={<IconMail className="h-4 w-4" />}
            label="Email"
            value={lead.email || "—"}
          />
          <CoordRow
            icon={<IconCampaign className="h-4 w-4" />}
            label="Campagne"
            value={lead.campaign || "—"}
          />
          <CoordRow
            icon={<IconCalendar className="h-4 w-4" />}
            label="Reçu le"
            value={dateLabel || "—"}
            last
          />
        </div>
      </section>
    </>
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
    <div className="space-y-3.5">
      <section
        className="rounded-2xl border p-3.5"
        style={{
          borderColor: "var(--dash-border)",
          backgroundColor: "var(--dash-field)",
        }}
      >
        <p
          className="mb-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
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

      <section
        className="rounded-2xl border p-3.5"
        style={{
          borderColor: "var(--dash-border)",
          backgroundColor: "var(--dash-field)",
        }}
      >
        <div
          className="rounded-xl border p-3"
          style={{
            borderColor: "var(--dash-border)",
            backgroundColor: "var(--dash-surface)",
          }}
        >
          <textarea
            value={noteBody}
            onChange={(event) => setNoteBody(event.target.value)}
            rows={4}
            placeholder="Écrire une note sur ce lead..."
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:opacity-60"
            style={{ color: "var(--dash-text)" }}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              disabled={noteBusy || !noteBody.trim()}
              onClick={() => void handleAddNote()}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold disabled:opacity-40"
              style={{
                borderColor: "var(--dash-border)",
                backgroundColor: "color-mix(in srgb, var(--dash-text) 12%, transparent)",
                color: "var(--dash-text)",
              }}
            >
              <IconSend className="h-3.5 w-3.5" />
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
          <p className="mt-3 text-sm" style={{ color: "var(--dash-muted)" }}>
            Aucune note pour le moment
          </p>
        ) : notes.length > 0 ? (
          <ul className="mt-3 space-y-2.5">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-xl border px-3 py-2.5"
                style={{
                  borderColor: "var(--dash-border)",
                  backgroundColor: "var(--dash-surface)",
                }}
              >
                <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--dash-text)" }}>
                  {note.body}
                </p>
                <p className="mt-1.5 text-[11px]" style={{ color: "var(--dash-muted)" }}>
                  {note.author} · {formatLeadDateTimeFr(note.created_at)}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section
        className="rounded-2xl border p-3.5"
        style={{
          borderColor: "var(--dash-border)",
          backgroundColor: "var(--dash-field)",
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
    <section>
      <h3 className="text-base font-semibold" style={{ color: "var(--dash-text)" }}>
        Suivi des actions
      </h3>
      <p className="mt-1 text-sm" style={{ color: "var(--dash-muted)" }}>
        Tout ce qui a été fait sur ce lead, par qui et quand.
      </p>

      {activities.length === 0 ? (
        <p
          className="mt-6 rounded-2xl border px-4 py-8 text-center text-sm"
          style={{
            borderColor: "var(--dash-border)",
            backgroundColor: "var(--dash-field)",
            color: "var(--dash-muted)",
          }}
        >
          Aucune action pour le moment.
        </p>
      ) : (
        <ol className="mt-4 space-y-0">
          {activities.map((activity, index) => (
            <li key={activity.id} className="flex gap-3">
              <div className="flex w-8 flex-col items-center">
                <span
                  className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                  style={{
                    borderColor: "var(--dash-border)",
                    backgroundColor: "var(--dash-field)",
                    color: "var(--dash-gold-muted)",
                  }}
                  aria-hidden
                  title={activityKindLabel(activity.kind)}
                >
                  {activityKindIcon(activity.kind)}
                </span>
                {index < activities.length - 1 ? (
                  <span
                    className="mt-1 w-px flex-1"
                    style={{ backgroundColor: "var(--dash-border)" }}
                    aria-hidden
                  />
                ) : null}
              </div>
              <div
                className={`min-w-0 flex-1 ${index < activities.length - 1 ? "pb-4" : ""}`}
              >
                <p
                  className="text-[11px] font-semibold tracking-[0.08em] uppercase"
                  style={{ color: "var(--dash-muted)" }}
                >
                  {activityKindLabel(activity.kind)}
                </p>
                <p
                  className="mt-0.5 text-sm font-medium"
                  style={{ color: "var(--dash-text)" }}
                >
                  {activity.message}
                </p>
                {activity.detail ? (
                  <p className="mt-0.5 text-xs" style={{ color: "var(--dash-muted)" }}>
                    {activity.detail}
                  </p>
                ) : null}
                <p className="mt-1 text-xs" style={{ color: "var(--dash-muted)" }}>
                  {activity.actor ? `${activity.actor} · ` : null}
                  {formatLeadDateTimeFr(activity.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
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
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors"
      style={{
        borderColor: active ? "var(--dash-gold-muted)" : "transparent",
        color: active ? "var(--dash-text)" : "var(--dash-muted)",
      }}
    >
      {icon}
      {label}
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
      className="flex items-center gap-3 px-3.5 py-3"
      style={{
        borderBottom: last ? undefined : "1px solid var(--dash-border)",
      }}
    >
      <span style={{ color: "var(--dash-muted)" }} aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
          {label}
        </p>
        <p
          className="truncate text-sm font-medium"
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
