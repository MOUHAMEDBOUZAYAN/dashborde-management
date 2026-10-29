"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PipelinesTabBar,
  type PipelineTabId,
} from "@/components/dashboard/pipelines-tab-bar";
import { IconChecklist } from "@/components/layout/nav-icons";
import { readErrorMessage } from "@/lib/auth-api";
import { t } from "@/lib/i18n";
import { leadActivityQueryKey } from "@/lib/pipeline-api";
import { fetchPipelines, pipelinesQueryKey } from "@/lib/pipelines-api";
import { invalidateClientStats } from "@/lib/stats-api";
import {
  fetchTasks,
  isTaskOverdue,
  remindTask,
  tasksQueryKey,
  updateTaskStatus,
} from "@/lib/tasks-api";
import { usePortalLocale } from "@/lib/use-portal-locale";
import type { Task } from "@/types";

export function MesTachesPage() {
  const queryClient = useQueryClient();
  const { locale } = usePortalLocale();
  const [selectedTab, setSelectedTab] = useState<PipelineTabId>("all");

  const pipelinesQuery = useQuery({
    queryKey: pipelinesQueryKey,
    queryFn: fetchPipelines,
  });

  const tasksQuery = useQuery({
    queryKey: tasksQueryKey,
    queryFn: () => fetchTasks(),
  });

  const pipelines = useMemo(
    () => pipelinesQuery.data ?? [],
    [pipelinesQuery.data],
  );
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);

  const counts = useMemo(() => {
    const byPipeline = Object.fromEntries(
      pipelines.map((pipeline) => [pipeline.id, 0]),
    ) as Record<string, number>;

    for (const task of tasks) {
      if (task.status !== "pending") continue;
      byPipeline[task.pipeline_id] = (byPipeline[task.pipeline_id] ?? 0) + 1;
    }

    return {
      all: tasks.filter((task) => task.status === "pending").length,
      byPipeline,
    };
  }, [pipelines, tasks]);

  const visibleTasks = useMemo(() => {
    const pending = tasks.filter((task) => task.status === "pending");
    if (selectedTab === "all") return pending;
    return pending.filter((task) => task.pipeline_id === selectedTab);
  }, [selectedTab, tasks]);

  const statusMutation = useMutation({
    mutationFn: ({
      taskId,
      status,
    }: {
      taskId: string;
      status: "done" | "cancelled";
      leadId: string | null;
    }) => updateTaskStatus(taskId, status),
    onSuccess: async (_task, variables) => {
      const jobs = [
        queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
        invalidateClientStats(queryClient),
      ];
      if (variables.leadId) {
        jobs.push(
          queryClient.invalidateQueries({
            queryKey: leadActivityQueryKey(variables.leadId),
          }),
        );
      }
      await Promise.all(jobs);
    },
  });

  const remindMutation = useMutation({
    mutationFn: ({
      taskId,
    }: {
      taskId: string;
      leadId: string | null;
    }) => remindTask(taskId),
    onSuccess: async (_task, variables) => {
      const jobs = [
        queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
        invalidateClientStats(queryClient),
      ];
      if (variables.leadId) {
        jobs.push(
          queryClient.invalidateQueries({
            queryKey: leadActivityQueryKey(variables.leadId),
          }),
        );
      }
      await Promise.all(jobs);
    },
  });

  const loading = pipelinesQuery.isLoading || tasksQuery.isLoading;
  const listError = tasksQuery.isError
    ? readErrorMessage(tasksQuery.error, "Impossible de charger les tâches.")
    : null;
  const actionError =
    statusMutation.isError || remindMutation.isError
      ? readErrorMessage(
          statusMutation.error ?? remindMutation.error,
          "Impossible de mettre à jour la tâche.",
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

      {listError || actionError ? (
        <p
          className="shrink-0 rounded-xl border px-3 py-2 text-sm"
          style={{
            borderColor: "rgba(248, 113, 113, 0.35)",
            color: "#f87171",
            backgroundColor: "rgba(248, 113, 113, 0.08)",
          }}
          role="alert"
        >
          {listError ?? actionError}
        </p>
      ) : null}

      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-xl border px-3 py-4 sm:rounded-2xl sm:px-4 sm:py-6 md:px-6"
        style={{
          backgroundColor: "var(--dash-surface)",
          borderColor: "var(--dash-border)",
          boxShadow: "var(--dash-shadow)",
        }}
      >
        {loading ? (
          <p
            className="flex flex-1 items-center justify-center text-sm"
            style={{ color: "var(--dash-muted)" }}
          >
            {t(locale, "loading")}
          </p>
        ) : visibleTasks.length === 0 ? (
          <TasksEmptyState message={t(locale, "emptyTasks")} />
        ) : (
          <ul className="space-y-3">
            {visibleTasks.map((task) => {
              const busyId =
                statusMutation.isPending
                  ? statusMutation.variables?.taskId
                  : remindMutation.isPending
                    ? remindMutation.variables?.taskId
                    : null;
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  busy={busyId === task.id}
                  onDone={() =>
                    statusMutation.mutate({
                      taskId: task.id,
                      status: "done",
                      leadId: task.lead_id,
                    })
                  }
                  onCancel={() =>
                    statusMutation.mutate({
                      taskId: task.id,
                      status: "cancelled",
                      leadId: task.lead_id,
                    })
                  }
                  onRemind={() =>
                    remindMutation.mutate({
                      taskId: task.id,
                      leadId: task.lead_id,
                    })
                  }
                />
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function TasksEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl border"
        style={{
          borderColor: "var(--dash-border)",
          color: "var(--dash-gold-muted)",
          backgroundColor: "rgba(196, 165, 116, 0.08)",
        }}
      >
        <IconChecklist />
      </div>
      <p
        className="mt-5 max-w-md text-sm leading-6"
        style={{ color: "var(--dash-muted)" }}
      >
        {message}
      </p>
    </div>
  );
}

function TaskRow({
  task,
  busy,
  onDone,
  onCancel,
  onRemind,
}: {
  task: Task;
  busy: boolean;
  onDone: () => void;
  onCancel: () => void;
  onRemind: () => void;
}) {
  const overdue = isTaskOverdue(task);

  return (
    <li
      className="flex flex-col gap-3 rounded-xl border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3"
      style={{
        borderColor: overdue
          ? "rgba(248, 113, 113, 0.45)"
          : "var(--dash-border)",
        backgroundColor: "rgba(0, 0, 0, 0.12)",
      }}
    >
      <div className="min-w-0">
        <p
          className="truncate text-sm font-semibold"
          style={{ color: "var(--dash-text)" }}
        >
          {task.title}
        </p>
        <p className="mt-1 truncate text-xs" style={{ color: "var(--dash-muted)" }}>
          {task.lead_name}
          {task.phone ? ` · ${task.phone}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {task.due_at ? (
          <span
            className="text-xs"
            style={{
              color: overdue ? "#f87171" : "var(--dash-gold-muted)",
            }}
          >
            {new Date(task.due_at).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={onRemind}
          className="inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium disabled:opacity-50"
          style={{
            borderColor: "var(--dash-border)",
            color: "var(--dash-text)",
            backgroundColor: "transparent",
          }}
        >
          Rappeler
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDone}
          className="inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold disabled:opacity-50"
          style={{
            backgroundColor: "var(--login-cream)",
            color: "#1c1814",
          }}
        >
          Fait
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onCancel}
          className="inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium disabled:opacity-50"
          style={{
            borderColor: "rgba(248, 113, 113, 0.4)",
            color: "#f87171",
            backgroundColor: "transparent",
          }}
        >
          Annuler
        </button>
      </div>
    </li>
  );
}
