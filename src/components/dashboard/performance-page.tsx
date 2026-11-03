"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PipelinesTabBar,
  type PipelineTabId,
} from "@/components/dashboard/pipelines-tab-bar";
import { readErrorMessage } from "@/lib/auth-api";
import { initialsFromName } from "@/lib/format-relative";
import { t } from "@/lib/i18n";
import {
  buildMemberScoreCards,
  formatMad,
  type PerformancePeriod,
} from "@/lib/performance-metrics";
import {
  fetchPipelineLeads,
  pipelineLeadsQueryKey,
} from "@/lib/pipeline-api";
import { fetchPipelines, pipelinesQueryKey } from "@/lib/pipelines-api";
import {
  allLeadActivitiesQueryKey,
  fetchAllLeadActivities,
  fetchPerformance,
  performanceStatsQueryKey,
} from "@/lib/stats-api";
import { fetchTeamMembers, teamMembersQueryKey } from "@/lib/team-api";
import { fetchTasks, tasksQueryKey } from "@/lib/tasks-api";
import { usePortalLocale } from "@/lib/use-portal-locale";
import { useAuthStore } from "@/store/auth-store";

const PERIOD_OPTIONS: { value: PerformancePeriod; label: string }[] = [
  { value: 7, label: "7 jours" },
  { value: 30, label: "30 jours" },
  { value: "all", label: "Tout" },
];

export function PerformancePageView() {
  const { locale } = usePortalLocale();
  const clientEmail = useAuthStore((state) => state.client?.email);
  const [selectedTab, setSelectedTab] = useState<PipelineTabId>("all");
  const [period, setPeriod] = useState<PerformancePeriod>(30);

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

  const teamQuery = useQuery({
    queryKey: teamMembersQueryKey,
    queryFn: fetchTeamMembers,
  });

  const activitiesQuery = useQuery({
    queryKey: allLeadActivitiesQueryKey,
    queryFn: () => fetchAllLeadActivities(100),
  });

  const performanceQuery = useQuery({
    queryKey: performanceStatsQueryKey,
    queryFn: fetchPerformance,
  });

  const pipelines = pipelinesQuery.data ?? [];
  const allLeads = leadsQuery.data ?? [];
  const allTasks = tasksQuery.data ?? [];
  const teamMembers = teamQuery.data ?? [];
  const activities = activitiesQuery.data ?? [];
  const totals = performanceQuery.data?.totals;

  const counts = useMemo(() => {
    const byPipeline = Object.fromEntries(
      pipelines.map((pipeline) => [pipeline.id, 0]),
    ) as Record<string, number>;

    for (const lead of allLeads) {
      byPipeline[lead.pipeline_id] = (byPipeline[lead.pipeline_id] ?? 0) + 1;
    }

    return { all: allLeads.length, byPipeline };
  }, [allLeads, pipelines]);

  const scopedLeads = useMemo(() => {
    if (selectedTab === "all") return allLeads;
    return allLeads.filter((lead) => lead.pipeline_id === selectedTab);
  }, [allLeads, selectedTab]);

  const scopedTasks = useMemo(() => {
    if (selectedTab === "all") return allTasks;
    return allTasks.filter((task) => task.pipeline_id === selectedTab);
  }, [allTasks, selectedTab]);

  const scoreCards = useMemo(
    () =>
      buildMemberScoreCards({
        members: teamMembers,
        leads: scopedLeads,
        tasks: scopedTasks,
        activities,
        youEmail: clientEmail,
        period,
      }),
    [
      teamMembers,
      scopedLeads,
      scopedTasks,
      activities,
      clientEmail,
      period,
    ],
  );

  const loading =
    pipelinesQuery.isLoading ||
    leadsQuery.isLoading ||
    tasksQuery.isLoading ||
    teamQuery.isLoading ||
    performanceQuery.isLoading;

  const performanceError = performanceQuery.isError
    ? readErrorMessage(
        performanceQuery.error,
        "Impossible de charger la performance.",
      )
    : null;

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
        ) : performanceError ? (
          <p
            className="rounded-2xl border px-4 py-6 text-center text-sm"
            style={{
              borderColor: "rgba(248, 113, 113, 0.35)",
              backgroundColor: "rgba(248, 113, 113, 0.08)",
              color: "#f87171",
            }}
            role="alert"
          >
            {performanceError}
          </p>
        ) : (
          <>
            {totals ? (
              <>
                <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
                  <KpiCard
                    label="Leads totaux"
                    value={String(totals.totalLeads)}
                  />
                  <KpiCard
                    label="Gagnés"
                    value={String(totals.won)}
                    tone="success"
                  />
                  <KpiCard
                    label="Taux de conversion"
                    value={`${totals.conversionRate} %`}
                    tone={totals.conversionRate > 0 ? "success" : "default"}
                  />
                  <KpiCard
                    label="Valeur gagnée"
                    value={formatMad(totals.estimatedWonValue)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
                  <KpiCard
                    label="En cours"
                    value={String(totals.inProgress)}
                  />
                  <KpiCard
                    label="Perdus"
                    value={String(totals.lost)}
                    tone={totals.lost > 0 ? "danger" : "default"}
                  />
                  <KpiCard
                    label="Tâches en cours"
                    value={String(totals.tasksPending)}
                  />
                  <KpiCard
                    label="Tâches terminées"
                    value={String(totals.tasksDone)}
                    tone="success"
                  />
                </div>
              </>
            ) : null}

            <section className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <p
                  className="max-w-xl text-sm leading-6"
                  style={{ color: "var(--dash-muted)" }}
                >
                  Le score combine la rapidité du premier contact, le respect
                  des échéances et les tâches en retard.
                </p>
                <PeriodFilter value={period} onChange={setPeriod} />
              </div>

              {scoreCards.length === 0 ? (
                <div
                  className="flex min-h-32 items-center justify-center rounded-2xl border px-4 py-8 text-center text-sm"
                  style={{
                    borderColor: "var(--dash-border)",
                    backgroundColor: "var(--dash-surface)",
                    color: "var(--dash-muted)",
                  }}
                >
                  Aucune donnée d&apos;équipe pour le moment.
                </div>
              ) : (
                <ul className="space-y-3">
                  {scoreCards.map((card) => (
                    <li key={card.key}>
                      <MemberScoreCardView card={card} />
                    </li>
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

function PeriodFilter({
  value,
  onChange,
}: {
  value: PerformancePeriod;
  onChange: (value: PerformancePeriod) => void;
}) {
  return (
    <div
      className="inline-flex shrink-0 rounded-full border p-0.5"
      style={{
        borderColor: "var(--dash-border)",
        backgroundColor: "var(--dash-surface)",
      }}
      role="group"
      aria-label="Période"
    >
      {PERIOD_OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-3.5"
            style={
              active
                ? {
                    backgroundColor: "var(--dash-nav-active-bg)",
                    color: "var(--dash-nav-active-text)",
                  }
                : { color: "var(--dash-muted)", backgroundColor: "transparent" }
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function MemberScoreCardView({
  card,
}: {
  card: ReturnType<typeof buildMemberScoreCards>[number];
}) {
  const initials = initialsFromName(card.name);
  const labelColor =
    card.score >= 80
      ? "#4ade80"
      : card.score >= 55
        ? "var(--dash-gold-muted)"
        : card.score >= 35
          ? "#fbbf24"
          : "#f87171";

  return (
    <article
      className="rounded-2xl border px-4 py-4 sm:px-5 sm:py-5"
      style={{
        borderColor: "var(--dash-border)",
        backgroundColor: "var(--dash-surface)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold tracking-wide"
            style={{
              backgroundColor: "var(--dash-nav-active-bg)",
              color: "var(--dash-nav-active-text)",
            }}
            aria-hidden
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p
              className="truncate text-sm font-semibold sm:text-base"
              style={{ color: "var(--dash-text)" }}
            >
              {card.name}
              {card.isYou ? (
                <span style={{ color: "var(--dash-muted)" }}> (vous)</span>
              ) : null}
            </p>
            <p
              className="mt-1 text-xs font-medium"
              style={{ color: labelColor }}
            >
              {card.label}
            </p>
          </div>
        </div>

        <p
          className="dash-display shrink-0 text-2xl tracking-tight sm:text-3xl"
          style={{ color: "var(--dash-text)" }}
        >
          {card.score}
          <span
            className="text-base sm:text-lg"
            style={{ color: "var(--dash-muted)" }}
          >
            {" "}
            / 100
          </span>
        </p>
      </div>

      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--dash-field)" }}
        role="progressbar"
        aria-valuenow={card.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Score ${card.score} sur 100`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${card.score}%`,
            backgroundColor: "var(--dash-nav-active-bg)",
          }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="Assignés" value={String(card.assigned)} />
        <Metric
          label="1er contact moyen"
          value={
            card.firstContactAvgMinutes > 0
              ? `${card.firstContactAvgMinutes} min`
              : "0 min"
          }
        />
        <Metric label="Tâches terminées" value={String(card.tasksDone)} />
        <Metric label="Dans les temps" value={`${card.onTimePercent} %`} />
        <Metric
          label="En retard"
          value={String(card.overdue)}
          tone={card.overdue > 0 ? "danger" : "default"}
        />
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <div>
      <p
        className="text-[10px] font-semibold tracking-[0.12em] uppercase"
        style={{ color: "var(--dash-gold-muted)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-sm font-semibold sm:text-base"
        style={{
          color: tone === "danger" ? "#f87171" : "var(--dash-text)",
        }}
      >
        {value}
      </p>
    </div>
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
        className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl"
        style={{ color: valueColor }}
      >
        {value}
      </p>
    </div>
  );
}
