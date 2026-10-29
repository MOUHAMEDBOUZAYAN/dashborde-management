"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { LeadDetailModal } from "@/components/dashboard/lead-detail-modal";
import { LeadsToolbar } from "@/components/dashboard/leads-toolbar";
import { NewLeadModal } from "@/components/dashboard/new-lead-modal";
import { PipelineListView } from "@/components/dashboard/pipeline-list-view";
import {
  PipelinesTabBar,
  type PipelineTabId,
} from "@/components/dashboard/pipelines-tab-bar";
import { readErrorMessage } from "@/lib/auth-api";
import type { LeadFormValues } from "@/lib/lead-form-schema";
import { filterLeads } from "@/lib/filter-leads";
import { t } from "@/lib/i18n";
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
import { invalidateClientStats } from "@/lib/stats-api";
import { fetchTeamMembers, teamMembersQueryKey } from "@/lib/team-api";
import { tasksQueryKey } from "@/lib/tasks-api";
import { usePortalLocale } from "@/lib/use-portal-locale";
import type { PipelineLead, PipelineStageId } from "@/types";

export function LeadsPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { locale } = usePortalLocale();
  const [selectedTab, setSelectedTab] = useState<PipelineTabId>("all");
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState<"all" | PipelineStageId>(
    "all",
  );
  const [dateFilter, setDateFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editLeadId, setEditLeadId] = useState<string | null>(null);
  const [detailLeadId, setDetailLeadId] = useState<string | null>(null);
  const [deleteLeadTarget, setDeleteLeadTarget] =
    useState<PipelineLead | null>(null);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q != null) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    const leadId = searchParams.get("lead");
    if (!leadId) return;
    setDetailLeadId(leadId);
    router.replace("/dashboard/leads", { scroll: false });
  }, [searchParams, router]);

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
    return (
      pipelines.find((pipeline) => pipeline.id === "principal")?.id ??
      pipelines[0]?.id ??
      "principal"
    );
  }, [pipelines, selectedTab]);

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

  const visibleLeads = useMemo(
    () =>
      filterLeads(allLeads, {
        pipelineId: selectedTab,
        search,
        ownerFilter,
        campaignFilter,
        dateFilter,
        stageFilter,
      }),
    [
      allLeads,
      selectedTab,
      search,
      ownerFilter,
      campaignFilter,
      dateFilter,
      stageFilter,
    ],
  );

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
      setCreateOpen(false);
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
  const formBusy =
    createLeadMutation.isPending || updateLeadMutation.isPending;
  const leadsError = leadsQuery.isError
    ? readErrorMessage(leadsQuery.error, "Impossible de charger les leads.")
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
          pipelines={pipelines}
        />
      </div>

      <div className="shrink-0">
        <LeadsToolbar
          search={search}
          onSearchChange={setSearch}
          ownerFilter={ownerFilter}
          onOwnerFilterChange={setOwnerFilter}
          campaignFilter={campaignFilter}
          onCampaignFilterChange={setCampaignFilter}
          stageFilter={stageFilter}
          onStageFilterChange={setStageFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          owners={owners}
          campaigns={campaigns}
          onNewLead={() => setCreateOpen(true)}
        />
      </div>

      {leadsError ? (
        <p
          className="shrink-0 rounded-xl border px-3 py-2 text-sm"
          style={{
            borderColor: "rgba(248, 113, 113, 0.35)",
            color: "#f87171",
            backgroundColor: "rgba(248, 113, 113, 0.08)",
          }}
          role="alert"
        >
          {leadsError}
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
        open={createOpen}
        submitting={createLeadMutation.isPending}
        error={createError}
        onClose={() => {
          if (!createLeadMutation.isPending) {
            createLeadMutation.reset();
            setCreateOpen(false);
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
        submitting={deleteLeadMutation.isPending || formBusy}
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
    </section>
  );
}
