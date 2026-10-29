"use client";

import { useMemo, useState } from "react";
import { Instrument_Serif } from "next/font/google";
import { useQuery } from "@tanstack/react-query";
import {
  PipelinesTabBar,
  type PipelineTabId,
} from "@/components/dashboard/pipelines-tab-bar";
import { readErrorMessage } from "@/lib/auth-api";
import { t } from "@/lib/i18n";
import { formatMad } from "@/lib/performance-metrics";
import {
  fetchPipelineLeads,
  pipelineLeadsQueryKey,
} from "@/lib/pipeline-api";
import { fetchPipelines, pipelinesQueryKey } from "@/lib/pipelines-api";
import {
  fetchPerformance,
  performanceStatsQueryKey,
} from "@/lib/stats-api";
import { usePortalLocale } from "@/lib/use-portal-locale";

const displaySerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

export function PerformancePageView() {
  const { locale } = usePortalLocale();
  const [selectedTab, setSelectedTab] = useState<PipelineTabId>("all");

  const pipelinesQuery = useQuery({
    queryKey: pipelinesQueryKey,
    queryFn: fetchPipelines,
  });

  const leadsQuery = useQuery({
    queryKey: pipelineLeadsQueryKey("all"),
    queryFn: () => fetchPipelineLeads("all"),
  });

  const performanceQuery = useQuery({
    queryKey: performanceStatsQueryKey,
    queryFn: fetchPerformance,
  });

  const pipelines = pipelinesQuery.data ?? [];
  const allLeads = leadsQuery.data ?? [];
  const totals = performanceQuery.data?.totals;
  const memberRows = performanceQuery.data?.team ?? [];

  const counts = useMemo(() => {
    const byPipeline = Object.fromEntries(
      pipelines.map((pipeline) => [pipeline.id, 0]),
    ) as Record<string, number>;

    for (const lead of allLeads) {
      byPipeline[lead.pipeline_id] = (byPipeline[lead.pipeline_id] ?? 0) + 1;
    }

    return { all: allLeads.length, byPipeline };
  }, [allLeads, pipelines]);

  const loading =
    pipelinesQuery.isLoading ||
    leadsQuery.isLoading ||
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
        ) : totals ? (
          <>
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3">
              <KpiCard label="Leads totaux" value={String(totals.totalLeads)} />
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
              <KpiCard label="En cours" value={String(totals.inProgress)} />
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

            <section className="space-y-3">
              <div>
                <h2
                  className={`${displaySerif.className} text-xl tracking-tight sm:text-2xl`}
                  style={{ color: "var(--dash-text)" }}
                >
                  Performance par membre
                </h2>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--dash-muted)" }}
                >
                  Résultats de chaque collaborateur sur les leads qui lui sont
                  assignés.
                </p>
              </div>

              {memberRows.length === 0 ? (
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
                <div
                  className="dash-h-scroll overflow-auto rounded-2xl border"
                  style={{
                    borderColor: "var(--dash-border)",
                    backgroundColor: "var(--dash-surface)",
                  }}
                >
                  <table className="min-w-[780px] w-full border-collapse text-left text-sm">
                    <thead>
                      <tr
                        className="border-b text-xs uppercase tracking-wide"
                        style={{
                          borderColor: "var(--dash-border)",
                          color: "var(--dash-muted)",
                        }}
                      >
                        <th className="px-4 py-3 font-semibold">Membre</th>
                        <th className="px-4 py-3 font-semibold">Rôle</th>
                        <th className="px-4 py-3 font-semibold">Leads</th>
                        <th className="px-4 py-3 font-semibold">En cours</th>
                        <th className="px-4 py-3 font-semibold">Gagnés</th>
                        <th className="px-4 py-3 font-semibold">Perdus</th>
                        <th className="px-4 py-3 font-semibold">Conversion</th>
                        <th className="px-4 py-3 font-semibold">Valeur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberRows.map((row) => (
                        <tr
                          key={row.key}
                          className="border-b last:border-b-0"
                          style={{ borderColor: "var(--dash-border)" }}
                        >
                          <td className="px-4 py-3">
                            <p
                              className="font-medium"
                              style={{ color: "var(--dash-text)" }}
                            >
                              {row.name}
                            </p>
                            {row.email ? (
                              <p
                                className="mt-0.5 text-xs"
                                style={{ color: "var(--dash-muted)" }}
                              >
                                {row.email}
                              </p>
                            ) : null}
                          </td>
                          <td
                            className="px-4 py-3"
                            style={{ color: "var(--dash-muted)" }}
                          >
                            {row.roleLabel}
                          </td>
                          <td
                            className="px-4 py-3"
                            style={{ color: "var(--dash-text)" }}
                          >
                            {row.leadsAssigned}
                          </td>
                          <td
                            className="px-4 py-3"
                            style={{ color: "var(--dash-text)" }}
                          >
                            {row.inProgress}
                          </td>
                          <td className="px-4 py-3" style={{ color: "#4ade80" }}>
                            {row.won}
                          </td>
                          <td
                            className="px-4 py-3"
                            style={{
                              color:
                                row.lost > 0 ? "#f87171" : "var(--dash-muted)",
                            }}
                          >
                            {row.lost}
                          </td>
                          <td
                            className="px-4 py-3 font-medium"
                            style={{ color: "var(--dash-text)" }}
                          >
                            {row.conversionRate} %
                          </td>
                          <td
                            className="px-4 py-3"
                            style={{ color: "var(--dash-gold-muted)" }}
                          >
                            {formatMad(row.estimatedWonValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}
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
        className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl"
        style={{ color: valueColor }}
      >
        {value}
      </p>
    </div>
  );
}
