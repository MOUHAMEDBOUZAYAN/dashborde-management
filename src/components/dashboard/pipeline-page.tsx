"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { LeadDetailModal } from "@/components/dashboard/lead-detail-modal";
import { NewLeadModal } from "@/components/dashboard/new-lead-modal";
import { NewTaskModal } from "@/components/dashboard/new-task-modal";
import { PipelineKanban } from "@/components/dashboard/pipeline-kanban";
import { PipelineListView } from "@/components/dashboard/pipeline-list-view";
import {
  PipelineToolbar,
  type PipelineViewMode,
} from "@/components/dashboard/pipeline-toolbar";
import {
  PipelinesTabBar,
  type PipelineTabId,
} from "@/components/dashboard/pipelines-tab-bar";
import { readErrorMessage } from "@/lib/auth-api";
import type { LeadFormValues } from "@/lib/lead-form-schema";
import { filterLeads } from "@/lib/filter-leads";
import {
  createLead,
  deleteLead,
  fetchPipelineLeads,
  leadActivityQueryKey,
  pipelineLeadsQueryKey,
  updateLead,
  updateLeadStage,
} from "@/lib/pipeline-api";
import { fetchPipelines, pipelinesQueryKey } from "@/lib/pipelines-api";
import { fetchTeamMembers, teamMembersQueryKey } from "@/lib/team-api";
import { invalidateClientStats } from "@/lib/stats-api";
import { createTask, tasksQueryKey } from "@/lib/tasks-api";
import { t } from "@/lib/i18n";
import { usePortalLocale } from "@/lib/use-portal-locale";
import type { PipelineLead, PipelineStageId } from "@/types";

export function PipelinePageView() {
  const queryClient = useQueryClient();
  const { locale } = usePortalLocale();
  const [selectedTab, setSelectedTab] = useState<PipelineTabId>("all");
  const [viewMode, setViewMode] = useState<PipelineViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null);
  const [editLeadId, setEditLeadId] = useState<string | null>(null);
  const [deleteLeadTarget, setDeleteLeadTarget] =
    useState<PipelineLead | null>(null);

  const pipelinesQuery = useQuery({
    queryKey: pipelinesQueryKey,
    queryFn: fetchPipelines,
  });

  const leadsQuery = useQuery({
    queryKey: pipelineLeadsQueryKey("all"),
    queryFn: () => fetchPipelineLeads("all"),
  });

  const teamQuery = useQuery({
    queryKey: teamMembersQueryKey,
    queryFn: fetchTeamMembers,
  });

  const pipelines = pipelinesQuery.data ?? [];
  const allLeads = leadsQuery.data ?? [];

  const activePipelineId = useMemo(() => {
    if (selectedTab !== "all") return selectedTab;
    return pipelines.find((pipeline) => pipeline.id === "principal")?.id
      ?? pipelines[0]?.id
      ?? "principal";
  }, [pipelines, selectedTab]);

  const leadsForTaskPicker = useMemo(() => {
    if (selectedTab === "all") return allLeads;
    return allLeads.filter((lead) => lead.pipeline_id === selectedTab);
  }, [allLeads, selectedTab]);

  const counts = useMemo(() => {
    const byPipeline = Object.fromEntries(
      pipelines.map((pipeline) => [pipeline.id, 0]),
    ) as Record<string, number>;

    for (const lead of allLeads) {
      byPipeline[lead.pipeline_id] = (byPipeline[lead.pipeline_id] ?? 0) + 1;
    }

    return { all: allLeads.length, byPipeline };
  }, [allLeads, pipelines]);

  const owners = useMemo(() => {
    const fromTeam = (teamQuery.data ?? []).map((member) => member.name);
    const fromLeads = allLeads.map((lead) => lead.owner).filter(Boolean);
    return Array.from(new Set([...fromTeam, ...fromLeads])).sort();
  }, [allLeads, teamQuery.data]);

  const campaigns = useMemo(
    () =>
      Array.from(
        new Set(allLeads.map((lead) => lead.campaign).filter(Boolean)),
      ).sort(),
    [allLeads],
  );

  const visibleLeads = useMemo(() => {
    return filterLeads(allLeads, {
      pipelineId: selectedTab,
      search,
      ownerFilter,
      campaignFilter,
      dateFilter,
    });
  }, [
    allLeads,
    selectedTab,
    search,
    ownerFilter,
    campaignFilter,
    dateFilter,
  ]);

  const detailLead =
    allLeads.find((lead) => lead.id === detailLeadId) ?? null;
  const editLead = allLeads.find((lead) => lead.id === editLeadId) ?? null;

  const createLeadMutation = useMutation({
    mutationFn: createLead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: pipelineLeadsQueryKey("all"),
        }),
        queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
        invalidateClientStats(queryClient),
      ]);
      setLeadModalOpen(false);
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({
      leadId,
      values,
    }: {
      leadId: string;
      values: LeadFormValues;
    }) => {
      const estimated =
        values.estimated_value.trim() === ""
          ? null
          : Number(values.estimated_value);
      return updateLead(leadId, {
        name: values.name,
        phone: values.phone,
        email: values.email,
        campaign: values.campaign,
        estimated_value: estimated,
      });
    },
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: pipelineLeadsQueryKey("all"),
        }),
        queryClient.invalidateQueries({
          queryKey: leadActivityQueryKey(updated.id),
        }),
      ]);
      setEditLeadId(null);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: async (task) => {
      const jobs = [
        queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
        invalidateClientStats(queryClient),
      ];
      if (task.lead_id) {
        jobs.push(
          queryClient.invalidateQueries({
            queryKey: leadActivityQueryKey(task.lead_id),
          }),
        );
      }
      await Promise.all(jobs);
      setTaskModalOpen(false);
    },
  });

  const stageMutation = useMutation({
    mutationFn: ({
      leadId,
      stage,
    }: {
      leadId: string;
      stage: PipelineStageId;
    }) => updateLeadStage(leadId, stage),
    onMutate: async ({ leadId, stage }) => {
      await queryClient.cancelQueries({
        queryKey: pipelineLeadsQueryKey("all"),
      });
      const previous = queryClient.getQueryData<PipelineLead[]>(
        pipelineLeadsQueryKey("all"),
      );
      queryClient.setQueryData<PipelineLead[]>(
        pipelineLeadsQueryKey("all"),
        (current) =>
          (current ?? []).map((lead) =>
            lead.id === leadId ? { ...lead, stage } : lead,
          ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          pipelineLeadsQueryKey("all"),
          context.previous,
        );
      }
    },
    onSettled: async (_data, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: pipelineLeadsQueryKey("all"),
        }),
        queryClient.invalidateQueries({
          queryKey: leadActivityQueryKey(variables.leadId),
        }),
        invalidateClientStats(queryClient),
      ]);
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: deleteLead,
    onMutate: async (leadId) => {
      await queryClient.cancelQueries({
        queryKey: pipelineLeadsQueryKey("all"),
      });
      const previous = queryClient.getQueryData<PipelineLead[]>(
        pipelineLeadsQueryKey("all"),
      );
      queryClient.setQueryData<PipelineLead[]>(
        pipelineLeadsQueryKey("all"),
        (current) => (current ?? []).filter((lead) => lead.id !== leadId),
      );
      setDetailLeadId((current) => (current === leadId ? null : current));
      setEditLeadId((current) => (current === leadId ? null : current));
      setDeleteLeadTarget(null);
      return { previous };
    },
    onError: (_error, _leadId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          pipelineLeadsQueryKey("all"),
          context.previous,
        );
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: pipelineLeadsQueryKey("all"),
        }),
        invalidateClientStats(queryClient),
      ]);
    },
  });

  const loading = pipelinesQuery.isLoading || leadsQuery.isLoading;
  const leadsError = leadsQuery.isError
    ? readErrorMessage(leadsQuery.error, "Impossible de charger les leads.")
    : null;
  const stageError = stageMutation.isError
    ? readErrorMessage(
        stageMutation.error,
        "Impossible de mettre à jour l'étape.",
      )
    : null;
  const createError = createLeadMutation.isError
    ? readErrorMessage(createLeadMutation.error, "Impossible d'ajouter le lead.")
    : null;
  const updateError = updateLeadMutation.isError
    ? readErrorMessage(
        updateLeadMutation.error,
        "Impossible de modifier le lead.",
      )
    : null;
  const deleteError = deleteLeadMutation.isError
    ? readErrorMessage(
        deleteLeadMutation.error,
        "Impossible de supprimer le lead.",
      )
    : null;

  function openEdit(lead: PipelineLead) {
    setEditLeadId(lead.id);
  }

  function requestDelete(lead: PipelineLead) {
    setDeleteLeadTarget(lead);
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:gap-4">
      <div className="shrink-0">
        <PipelinesTabBar
          selectedTab={selectedTab}
          onSelectTab={setSelectedTab}
          counts={counts}
          showSettings
          pipelines={pipelines}
        />
      </div>

      <div className="shrink-0">
        <PipelineToolbar
          search={search}
          onSearchChange={setSearch}
          ownerFilter={ownerFilter}
          onOwnerFilterChange={setOwnerFilter}
          campaignFilter={campaignFilter}
          onCampaignFilterChange={setCampaignFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          owners={owners}
          campaigns={campaigns}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNewLead={() => setLeadModalOpen(true)}
          onNewTask={() => setTaskModalOpen(true)}
        />
      </div>

      {leadsError || stageError ? (
        <p
          className="shrink-0 rounded-xl border px-3 py-2 text-sm"
          style={{
            borderColor: "rgba(248, 113, 113, 0.35)",
            color: "#f87171",
            backgroundColor: "rgba(248, 113, 113, 0.08)",
          }}
          role="alert"
        >
          {leadsError ?? stageError}
        </p>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {loading ? (
          <p
            className="flex flex-1 items-center justify-center text-sm"
            style={{ color: "var(--dash-muted)" }}
          >
            {t(locale, "loading")}
          </p>
        ) : viewMode === "kanban" ? (
          <PipelineKanban
            leads={visibleLeads}
            onLeadOpen={(lead) => setDetailLeadId(lead.id)}
            onStageChange={(leadId, stage) =>
              stageMutation.mutate({ leadId, stage })
            }
          />
        ) : (
          <PipelineListView
            leads={visibleLeads}
            onLeadOpen={(lead) => setDetailLeadId(lead.id)}
            onLeadEdit={openEdit}
            onLeadDelete={requestDelete}
          />
        )}
      </div>

      <LeadDetailModal
        open={detailLeadId !== null}
        lead={detailLead}
        assignees={owners}
        submitting={stageMutation.isPending}
        deleting={deleteLeadMutation.isPending}
        onClose={() => setDetailLeadId(null)}
        onStageChange={(stage) => {
          if (!detailLeadId) return;
          stageMutation.mutate({ leadId: detailLeadId, stage });
        }}
        onOwnerChange={(owner) => {
          if (!detailLeadId) return;
          queryClient.setQueryData<PipelineLead[]>(
            pipelineLeadsQueryKey("all"),
            (current) =>
              (current ?? []).map((item) =>
                item.id === detailLeadId ? { ...item, owner } : item,
              ),
          );
        }}
        onEdit={() => {
          if (!detailLead) return;
          setDetailLeadId(null);
          openEdit(detailLead);
        }}
        onDelete={() => {
          if (!detailLead) return;
          requestDelete(detailLead);
        }}
      />

      <NewLeadModal
        open={leadModalOpen}
        submitting={createLeadMutation.isPending}
        error={createError}
        onClose={() => {
          if (!createLeadMutation.isPending) {
            createLeadMutation.reset();
            setLeadModalOpen(false);
          }
        }}
        onSubmit={(values: LeadFormValues) => {
          const estimated =
            values.estimated_value.trim() === ""
              ? null
              : Number(values.estimated_value);
          createLeadMutation.mutate({
            name: values.name,
            phone: values.phone,
            email: values.email,
            campaign: values.campaign,
            estimated_value: estimated,
            pipeline_id: activePipelineId,
          });
        }}
      />

      <NewLeadModal
        open={editLeadId !== null}
        lead={editLead}
        submitting={updateLeadMutation.isPending}
        error={updateError}
        onClose={() => {
          if (!updateLeadMutation.isPending) {
            updateLeadMutation.reset();
            setEditLeadId(null);
          }
        }}
        onSubmit={(values: LeadFormValues) => {
          if (!editLeadId) return;
          updateLeadMutation.mutate({ leadId: editLeadId, values });
        }}
      />

      <ConfirmDialog
        open={deleteLeadTarget !== null}
        title="Supprimer le lead"
        message={
          deleteLeadTarget
            ? `Supprimer « ${deleteLeadTarget.name} » ? Cette action est définitive.`
            : ""
        }
        confirmLabel="Supprimer"
        destructive
        submitting={deleteLeadMutation.isPending}
        error={deleteError}
        onCancel={() => {
          if (!deleteLeadMutation.isPending) {
            deleteLeadMutation.reset();
            setDeleteLeadTarget(null);
          }
        }}
        onConfirm={() => {
          if (!deleteLeadTarget) return;
          deleteLeadMutation.mutate(deleteLeadTarget.id);
        }}
      />

      <NewTaskModal
        open={taskModalOpen}
        leads={leadsForTaskPicker}
        submitting={createTaskMutation.isPending}
        error={
          createTaskMutation.isError
            ? readErrorMessage(
                createTaskMutation.error,
                "Impossible d'ajouter la tâche.",
              )
            : null
        }
        onClose={() => {
          if (!createTaskMutation.isPending) {
            createTaskMutation.reset();
            setTaskModalOpen(false);
          }
        }}
        onSubmit={({ lead, ...values }) => {
          createTaskMutation.mutate({
            lead_id: lead.id,
            lead_name: lead.name,
            phone: lead.phone,
            pipeline_id: lead.pipeline_id,
            task_type: values.task_type,
            due_at: new Date(values.due_at).toISOString(),
            details: values.details,
          });
        }}
      />
    </section>
  );
}
