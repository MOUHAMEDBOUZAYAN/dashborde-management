"use client";

import { useMemo, useState } from "react";
import { Instrument_Serif } from "next/font/google";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FilterDropdown } from "@/components/dashboard/filter-dropdown";
import {
  PipelinesTabBar,
  type PipelineTabId,
} from "@/components/dashboard/pipelines-tab-bar";
import {
  IconBell,
  IconCheck,
  IconPhone,
} from "@/components/layout/nav-icons";
import { readErrorMessage } from "@/lib/auth-api";
import {
  formatLeadDateTimeFr,
  formatOverdueFr,
} from "@/lib/format-relative";
import { t } from "@/lib/i18n";
import {
  activityKindLabel,
  fetchPipelineLeads,
  leadActivityQueryKey,
  pipelineLeadsQueryKey,
} from "@/lib/pipeline-api";
import { fetchPipelines, pipelinesQueryKey } from "@/lib/pipelines-api";
import {
  allLeadActivitiesQueryKey,
  fetchAllLeadActivities,
  fetchSuiviStats,
  invalidateClientStats,
  suiviStatsQueryKey,
} from "@/lib/stats-api";
import {
  CONTACT_THRESHOLD_OPTIONS,
  leadsOverdueForContact,
  overdueTasks,
  type ContactThresholdMinutes,
} from "@/lib/suivi-metrics";
import { fetchTasks, remindTask, tasksQueryKey } from "@/lib/tasks-api";
import { usePortalLocale } from "@/lib/use-portal-locale";
import type { LeadActivity, PipelineLead, Task } from "@/types";

const displaySerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

export function SuiviPageView() {
  const queryClient = useQueryClient();
  const { locale } = usePortalLocale();
  const [selectedTab, setSelectedTab] = useState<PipelineTabId>("all");
  const [threshold, setThreshold] = useState<ContactThresholdMinutes>(30);

  const pipelinesQuery = useQuery({
    queryKey: pipelinesQueryKey,
    queryFn: fetchPipelines,
  });

  const leadsQuery = useQuery({
    queryKey: pipelineLeadsQueryKey("all"),
    queryFn: () => fetchPipelineLeads("all"),
  });

  const tasksQuery = useQuery({
    queryKey: tasksQueryKey,
    queryFn: () => fetchTasks(),
  });

  const statsQuery = useQuery({
    queryKey: suiviStatsQueryKey(threshold),
    queryFn: () => fetchSuiviStats(threshold),
  });

  const activitiesQuery = useQuery({
    queryKey: allLeadActivitiesQueryKey,
    queryFn: () => fetchAllLeadActivities(100),
  });

  const pipelines = pipelinesQuery.data ?? [];
  const allLeads = leadsQuery.data ?? [];
  const allTasks = tasksQuery.data ?? [];
  const stats = statsQuery.data;
  const activities = activitiesQuery.data ?? [];

  const scopedLeads = useMemo(() => {
    if (selectedTab === "all") return allLeads;
    return allLeads.filter((lead) => lead.pipeline_id === selectedTab);
  }, [allLeads, selectedTab]);

  const scopedTasks = useMemo(() => {
    if (selectedTab === "all") return allTasks;
    return allTasks.filter((task) => task.pipeline_id === selectedTab);
  }, [allTasks, selectedTab]);

  const counts = useMemo(() => {
    const byPipeline = Object.fromEntries(
      pipelines.map((pipeline) => [pipeline.id, 0]),
    ) as Record<string, number>;

    for (const lead of allLeads) {
      byPipeline[lead.pipeline_id] = (byPipeline[lead.pipeline_id] ?? 0) + 1;
    }

    return { all: allLeads.length, byPipeline };
  }, [allLeads, pipelines]);

  const contactOverdue = useMemo(
    () => leadsOverdueForContact(scopedLeads, threshold),
    [scopedLeads, threshold],
  );
  const lateTasks = useMemo(() => overdueTasks(scopedTasks), [scopedTasks]);

  const remindMutation = useMutation({
    mutationFn: (task: Task) => remindTask(task.id),
    onSuccess: async (updated) => {
      const jobs = [
        queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
        invalidateClientStats(queryClient),
      ];
      if (updated.lead_id) {
        jobs.push(
          queryClient.invalidateQueries({
            queryKey: leadActivityQueryKey(updated.lead_id),
          }),
        );
      }
      await Promise.all(jobs);
    },
  });

  const loading =
    pipelinesQuery.isLoading ||
    leadsQuery.isLoading ||
    tasksQuery.isLoading ||
    statsQuery.isLoading;

  const statsError = statsQuery.isError
    ? readErrorMessage(statsQuery.error, "Impossible de charger les stats.")
    : null;
  const activitiesError = activitiesQuery.isError
    ? readErrorMessage(
        activitiesQuery.error,
        "Impossible de charger l'activité.",
      )
    : null;

  const waitingCount = stats?.waiting_leads ?? 0;
  const firstContactAvg = stats?.first_contact_avg_minutes ?? 0;
  const overdueTasksCount = stats?.overdue_tasks ?? 0;
  const reminders24h = stats?.reminders_last_24h ?? 0;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:gap-4">
      <div className="shrink-0">
        <PipelinesTabBar
          selectedTab={selectedTab}
          onSelectTab={setSelectedTab}
          counts={counts}
          pipelines={pipelines}
        />
      </div>

      <div className="dash-v-scroll min-h-0 flex-1 space-y-5 overflow-y-auto pb-2">
        {loading ? (
          <p
            className="flex min-h-40 items-center justify-center text-sm"
            style={{ color: "var(--dash-muted)" }}
          >
            {t(locale, "loading")}
          </p>
        ) : statsError ? (
          <p
            className="rounded-2xl border px-4 py-6 text-center text-sm"
            style={{
              borderColor: "rgba(248, 113, 113, 0.35)",
              backgroundColor: "rgba(248, 113, 113, 0.08)",
              color: "#f87171",
            }}
            role="alert"
          >
            {statsError}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
              <KpiCard
                label="Leads en attente"
                value={String(waitingCount)}
                tone="success"
              />
              <KpiCard
                label="1er contact moyen"
                value={
                  firstContactAvg > 0 ? `${firstContactAvg} min` : "0 min"
                }
              />
              <KpiCard
                label="Tâches en retard"
                value={String(overdueTasksCount)}
                tone={overdueTasksCount > 0 ? "danger" : "default"}
              />
              <KpiCard
                label="Rappels envoyés (24 h)"
                value={String(reminders24h)}
              />
            </div>

            <section className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2
                    className={`${displaySerif.className} text-xl tracking-tight sm:text-2xl`}
                    style={{ color: "var(--dash-text)" }}
                  >
                    Leads à contacter
                  </h2>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "var(--dash-muted)" }}
                  >
                    Un lead est en retard s&apos;il n&apos;a reçu aucun contact
                    après :
                  </p>
                </div>
                <FilterDropdown
                  ariaLabel="Délai avant retard de contact"
                  value={String(threshold)}
                  onChange={(value) =>
                    setThreshold(Number(value) as ContactThresholdMinutes)
                  }
                  options={CONTACT_THRESHOLD_OPTIONS.map((option) => ({
                    value: String(option.value),
                    label: option.label,
                  }))}
                />
              </div>

              {contactOverdue.length === 0 ? (
                <div
                  className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-8 text-center"
                  style={{
                    borderColor: "var(--dash-border)",
                    backgroundColor: "var(--dash-surface)",
                  }}
                >
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, #22c55e 18%, transparent)",
                      color: "#4ade80",
                    }}
                    aria-hidden
                  >
                    <IconCheck className="h-5 w-5" />
                  </span>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--dash-text)" }}
                  >
                    Tous les leads ont été contactés à temps.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {contactOverdue.map((lead) => (
                    <ContactOverdueCard key={lead.id} lead={lead} />
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-3">
              <h2
                className={`${displaySerif.className} text-xl tracking-tight sm:text-2xl`}
                style={{ color: "var(--dash-text)" }}
              >
                Tâches en retard
              </h2>

              {lateTasks.length === 0 ? (
                <div
                  className="flex min-h-28 items-center justify-center rounded-2xl border px-4 py-6 text-center text-sm"
                  style={{
                    borderColor: "var(--dash-border)",
                    backgroundColor: "var(--dash-surface)",
                    color: "var(--dash-muted)",
                  }}
                >
                  Aucune tâche en retard.
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {lateTasks.map((task) => {
                    const lead = task.lead_id
                      ? allLeads.find((item) => item.id === task.lead_id)
                      : undefined;
                    return (
                      <OverdueTaskCard
                        key={task.id}
                        task={task}
                        owner={lead?.owner ?? ""}
                        reminding={
                          remindMutation.isPending &&
                          remindMutation.variables?.id === task.id
                        }
                        onRemind={() => remindMutation.mutate(task)}
                      />
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h2
                  className={`${displaySerif.className} text-xl tracking-tight sm:text-2xl`}
                  style={{ color: "var(--dash-text)" }}
                >
                  Activité récente
                </h2>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--dash-muted)" }}
                >
                  Flux global des événements sur vos leads.
                </p>
              </div>

              {activitiesQuery.isLoading ? (
                <p className="text-sm" style={{ color: "var(--dash-muted)" }}>
                  {t(locale, "loading")}
                </p>
              ) : activitiesError ? (
                <p className="text-sm text-red-500" role="alert">
                  {activitiesError}
                </p>
              ) : activities.length === 0 ? (
                <div
                  className="flex min-h-28 items-center justify-center rounded-2xl border px-4 py-6 text-center text-sm"
                  style={{
                    borderColor: "var(--dash-border)",
                    backgroundColor: "var(--dash-surface)",
                    color: "var(--dash-muted)",
                  }}
                >
                  Aucune activité pour le moment.
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {activities.map((activity) => (
                    <ActivityFeedCard key={activity.id} activity={activity} />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "danger";
}) {
  const valueColor =
    tone === "success"
      ? "#4ade80"
      : tone === "danger"
        ? "#f87171"
        : "var(--dash-text)";

  return (
    <div
      className="rounded-2xl border px-3.5 py-3.5 sm:px-4 sm:py-4"
      style={{
        borderColor: "var(--dash-border)",
        backgroundColor: "var(--dash-surface)",
      }}
    >
      <p
        className="text-[11px] font-semibold tracking-[0.12em] uppercase"
        style={{ color: "var(--dash-muted)" }}
      >
        {label}
      </p>
      <p
        className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
        style={{ color: valueColor }}
      >
        {value}
      </p>
    </div>
  );
}

function ContactOverdueCard({ lead }: { lead: PipelineLead }) {
  const delay = formatOverdueFr(lead.date);
  return (
    <li
      className="flex flex-wrap items-center gap-3 rounded-2xl border px-3.5 py-3 sm:px-4"
      style={{
        borderColor: "var(--dash-border)",
        backgroundColor: "var(--dash-surface)",
      }}
    >
      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: "color-mix(in srgb, #f87171 16%, transparent)",
          color: "#f87171",
        }}
        aria-hidden
      >
        <IconPhone className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
          {lead.name}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--dash-muted)" }}>
          {(lead.owner.trim() || "Non assigné") +
            " · " +
            (formatLeadDateTimeFr(lead.date) || "—")}
        </p>
      </div>
      {delay ? (
        <p className="text-sm font-medium" style={{ color: "#f87171" }}>
          {delay}
        </p>
      ) : null}
    </li>
  );
}

function OverdueTaskCard({
  task,
  owner,
  reminding,
  onRemind,
}: {
  task: Task;
  owner: string;
  reminding: boolean;
  onRemind: () => void;
}) {
  const delay = task.due_at ? formatOverdueFr(task.due_at) : "";
  const when = task.due_at ? formatLeadDateTimeFr(task.due_at) : "—";

  return (
    <li
      className="flex flex-wrap items-center gap-3 rounded-2xl border px-3.5 py-3 sm:px-4"
      style={{
        borderColor: "var(--dash-border)",
        backgroundColor: "var(--dash-surface)",
      }}
    >
      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: "color-mix(in srgb, #f472b6 16%, transparent)",
          color: "#f472b6",
        }}
        aria-hidden
      >
        <IconPhone className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-semibold"
          style={{ color: "var(--dash-text)" }}
        >
          {task.lead_name}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: "var(--dash-muted)" }}>
          {(owner.trim() || "Non assigné") + " · " + when}
        </p>
      </div>

      {delay ? (
        <p className="text-sm font-medium" style={{ color: "#f87171" }}>
          {delay}
        </p>
      ) : null}

      <button
        type="button"
        disabled={reminding}
        onClick={onRemind}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold disabled:opacity-50"
        style={{
          borderColor: "var(--dash-border)",
          backgroundColor: "var(--dash-field)",
          color: "var(--dash-text)",
        }}
      >
        <IconBell className="h-3.5 w-3.5" />
        {reminding ? "Envoi…" : "Rappeler"}
      </button>
    </li>
  );
}

function ActivityFeedCard({ activity }: { activity: LeadActivity }) {
  return (
    <li
      className="rounded-2xl border px-3.5 py-3 sm:px-4"
      style={{
        borderColor: "var(--dash-border)",
        backgroundColor: "var(--dash-surface)",
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--dash-muted)" }}
        >
          {activityKindLabel(activity.kind)}
        </p>
        <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
          {formatLeadDateTimeFr(activity.created_at)}
        </p>
      </div>
      <p
        className="mt-1 text-sm font-medium"
        style={{ color: "var(--dash-text)" }}
      >
        {activity.message}
      </p>
      {activity.detail ? (
        <p className="mt-0.5 text-sm" style={{ color: "var(--dash-muted)" }}>
          {activity.detail}
        </p>
      ) : null}
      {activity.actor ? (
        <p className="mt-1 text-xs" style={{ color: "var(--dash-muted)" }}>
          {activity.actor}
        </p>
      ) : null}
    </li>
  );
}
