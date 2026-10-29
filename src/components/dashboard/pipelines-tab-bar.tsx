"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { PipelineFormModal } from "@/components/dashboard/pipeline-form-modal";
import { IconPlus, IconSliders } from "@/components/layout/nav-icons";
import { readErrorMessage } from "@/lib/auth-api";
import { t } from "@/lib/i18n";
import {
  createPipeline,
  deletePipeline,
  fetchPipelines,
  pipelinesQueryKey,
  updatePipeline,
} from "@/lib/pipelines-api";
import { usePortalLocale } from "@/lib/use-portal-locale";
import type { Pipeline } from "@/types";

export type PipelineTabId = "all" | string;

type FormState =
  | { mode: "create" }
  | { mode: "edit"; pipeline: Pipeline }
  | null;

type PipelinesTabBarProps = {
  selectedTab: PipelineTabId;
  onSelectTab: (tab: PipelineTabId) => void;
  counts: { all: number; byPipeline: Record<string, number> };
  showSettings?: boolean;
  onSettingsClick?: () => void;
  pipelines?: Pipeline[];
  onPipelinesLoaded?: (pipelines: Pipeline[]) => void;
};

export function PipelinesTabBar({
  selectedTab,
  onSelectTab,
  counts,
  showSettings = false,
  onSettingsClick,
  pipelines: pipelinesProp,
  onPipelinesLoaded,
}: PipelinesTabBarProps) {
  const queryClient = useQueryClient();
  const { locale } = usePortalLocale();
  const [formState, setFormState] = useState<FormState>(null);
  const [pipelineToDelete, setPipelineToDelete] = useState<Pipeline | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const pipelinesQuery = useQuery({
    queryKey: pipelinesQueryKey,
    queryFn: fetchPipelines,
    enabled: pipelinesProp === undefined,
  });

  const pipelines = pipelinesProp ?? pipelinesQuery.data ?? [];

  useEffect(() => {
    if (pipelinesProp === undefined && pipelinesQuery.data) {
      onPipelinesLoaded?.(pipelinesQuery.data);
    }
  }, [onPipelinesLoaded, pipelinesProp, pipelinesQuery.data]);

  const createMutation = useMutation({
    mutationFn: createPipeline,
    onSuccess: async (pipeline) => {
      queryClient.setQueryData<Pipeline[]>(pipelinesQueryKey, (current) => [
        ...(current ?? []),
        pipeline,
      ]);
      await queryClient.invalidateQueries({ queryKey: pipelinesQueryKey });
      onSelectTab(pipeline.id);
      setFormState(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      name,
      color,
    }: {
      id: string;
      name: string;
      color: string;
    }) => updatePipeline(id, { name, color }),
    onSuccess: async (pipeline) => {
      queryClient.setQueryData<Pipeline[]>(pipelinesQueryKey, (current) =>
        (current ?? []).map((item) =>
          item.id === pipeline.id ? pipeline : item,
        ),
      );
      await queryClient.invalidateQueries({ queryKey: pipelinesQueryKey });
      setFormState(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePipeline,
    onSuccess: async (_void, id) => {
      queryClient.setQueryData<Pipeline[]>(pipelinesQueryKey, (current) =>
        (current ?? []).filter((item) => item.id !== id),
      );
      await queryClient.invalidateQueries({ queryKey: pipelinesQueryKey });
      if (selectedTab === id) onSelectTab("all");
      setPipelineToDelete(null);
    },
  });

  const formSubmitting = createMutation.isPending || updateMutation.isPending;
  const formError =
    formState?.mode === "edit"
      ? updateMutation.error
        ? readErrorMessage(updateMutation.error, "Impossible de modifier le pipeline.")
        : null
      : createMutation.error
        ? readErrorMessage(createMutation.error, "Impossible de créer le pipeline.")
        : null;
  const deleteError = deleteMutation.error
    ? readErrorMessage(deleteMutation.error, "Impossible de supprimer le pipeline.")
    : null;

  const listError =
    pipelinesProp === undefined && pipelinesQuery.isError
      ? readErrorMessage(
          pipelinesQuery.error,
          "Impossible de charger les pipelines.",
        )
      : null;

  return (
    <>
      <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="dash-h-scroll flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-0.5">
          <PipelineTab
            active={selectedTab === "all"}
            label={t(locale, "all")}
            count={counts.all}
            onClick={() => onSelectTab("all")}
          />

          {pipelines.map((pipeline) => (
            <PipelineTab
              key={pipeline.id}
              active={selectedTab === pipeline.id}
              label={pipeline.name}
              count={counts.byPipeline[pipeline.id] ?? 0}
              color={pipeline.color}
              menuOpen={menuOpenId === pipeline.id}
              onClick={() => onSelectTab(pipeline.id)}
              onToggleMenu={() =>
                setMenuOpenId((current) =>
                  current === pipeline.id ? null : pipeline.id,
                )
              }
              onCloseMenu={() => setMenuOpenId(null)}
              onEdit={() => {
                setMenuOpenId(null);
                updateMutation.reset();
                setFormState({ mode: "edit", pipeline });
              }}
              onDelete={() => {
                setMenuOpenId(null);
                deleteMutation.reset();
                setPipelineToDelete(pipeline);
              }}
            />
          ))}

          <button
            type="button"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap transition-opacity hover:opacity-90"
            style={{
              borderColor: "var(--dash-border)",
              color: "var(--dash-muted)",
              backgroundColor: "var(--dash-surface)",
            }}
            onClick={() => {
              createMutation.reset();
              setFormState({ mode: "create" });
            }}
          >
            <IconPlus className="h-3.5 w-3.5" />
            {t(locale, "newPipeline")}
          </button>
        </div>

        {showSettings ? (
          <button
            type="button"
            aria-label={t(locale, "filters")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
            style={{
              borderColor: "var(--dash-border)",
              color: "var(--dash-muted)",
              backgroundColor: "var(--dash-surface)",
            }}
            onClick={onSettingsClick}
          >
            <IconSliders />
          </button>
        ) : null}
      </div>

      {listError ? (
        <p className="text-sm" style={{ color: "#f87171" }} role="alert">
          {listError}
        </p>
      ) : null}
      </div>

      <PipelineFormModal
        open={formState !== null}
        mode={formState?.mode === "edit" ? "edit" : "create"}
        initial={
          formState?.mode === "edit"
            ? {
                name: formState.pipeline.name,
                color: formState.pipeline.color,
              }
            : null
        }
        submitting={formSubmitting}
        error={formError}
        onClose={() => {
          if (!formSubmitting) {
            createMutation.reset();
            updateMutation.reset();
            setFormState(null);
          }
        }}
        onSubmit={(values) => {
          if (formState?.mode === "edit") {
            updateMutation.mutate({ id: formState.pipeline.id, ...values });
            return;
          }
          createMutation.mutate(values);
        }}
      />

      <ConfirmDialog
        open={pipelineToDelete !== null}
        title="Supprimer le pipeline"
        message={`Es-tu sûr de vouloir supprimer « ${pipelineToDelete?.name ?? ""} » ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        destructive
        submitting={deleteMutation.isPending}
        error={deleteError}
        onCancel={() => {
          if (!deleteMutation.isPending) {
            deleteMutation.reset();
            setPipelineToDelete(null);
          }
        }}
        onConfirm={() => {
          if (!pipelineToDelete) return;
          deleteMutation.mutate(pipelineToDelete.id);
        }}
      />
    </>
  );
}

function PipelineTab({
  active,
  label,
  count,
  color,
  menuOpen = false,
  onClick,
  onToggleMenu,
  onCloseMenu,
  onEdit,
  onDelete,
}: {
  active: boolean;
  label: string;
  count: number;
  color?: string;
  menuOpen?: boolean;
  onClick: () => void;
  onToggleMenu?: () => void;
  onCloseMenu?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const editable = Boolean(onEdit && onDelete && onToggleMenu);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        onCloseMenu?.();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen, onCloseMenu]);

  return (
    <div className="relative inline-flex shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex h-9 items-center gap-2 border text-sm font-medium whitespace-nowrap transition-colors ${
          editable ? "rounded-l-full border-r-0 pl-3 pr-2" : "rounded-full px-3"
        }`}
        style={
          active
            ? {
                backgroundColor: "var(--dash-nav-active-bg)",
                color: "var(--dash-nav-active-text)",
                borderColor: "transparent",
              }
            : {
                backgroundColor: "var(--dash-surface)",
                color: "var(--dash-text)",
                borderColor: "var(--dash-border)",
              }
        }
      >
        {color ? (
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden
          />
        ) : null}
        <span>{label}</span>
        <span
          className="rounded-full px-1.5 text-[11px] font-semibold"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--dash-text) 8%, transparent)",
            color: "var(--dash-muted)",
          }}
        >
          {count}
        </span>
      </button>

      {editable ? (
        <>
          <button
            type="button"
            aria-label={`Actions ${label}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={(event) => {
              event.stopPropagation();
              onToggleMenu?.();
            }}
            className="inline-flex h-9 items-center rounded-r-full border px-2 text-sm"
            style={
              active
                ? {
                    backgroundColor: "var(--dash-nav-active-bg)",
                    color: "var(--dash-nav-active-text)",
                    borderColor: "transparent",
                  }
                : {
                    backgroundColor: "var(--dash-surface)",
                    color: "var(--dash-muted)",
                    borderColor: "var(--dash-border)",
                  }
            }
          >
            ···
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute top-[calc(100%+6px)] right-0 z-20 min-w-[148px] overflow-hidden rounded-xl border py-1 shadow-lg"
              style={{
                backgroundColor: "var(--dash-surface)",
                borderColor: "var(--dash-border)",
              }}
            >
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-black/10"
                style={{ color: "var(--dash-text)" }}
                onClick={onEdit}
              >
                Modifier
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-black/10"
                style={{ color: "#f87171" }}
                onClick={onDelete}
              >
                Supprimer
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
