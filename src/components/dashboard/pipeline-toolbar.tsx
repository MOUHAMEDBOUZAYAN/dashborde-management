"use client";

import type { ReactNode } from "react";
import { FilterDropdown } from "@/components/dashboard/filter-dropdown";
import {
  IconKanban,
  IconList,
  IconNewTask,
  IconPlus,
  IconSearch,
} from "@/components/layout/nav-icons";

export type PipelineViewMode = "kanban" | "list";

type PipelineToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
  campaignFilter: string;
  onCampaignFilterChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  owners: string[];
  campaigns: string[];
  viewMode: PipelineViewMode;
  onViewModeChange: (mode: PipelineViewMode) => void;
  onNewLead: () => void;
  onNewTask: () => void;
};

export function PipelineToolbar({
  search,
  onSearchChange,
  ownerFilter,
  onOwnerFilterChange,
  campaignFilter,
  onCampaignFilterChange,
  dateFilter,
  onDateFilterChange,
  owners,
  campaigns,
  viewMode,
  onViewModeChange,
  onNewLead,
  onNewTask,
}: PipelineToolbarProps) {
  return (
    <div className="flex flex-col gap-2 xl:gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onNewLead}
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-opacity hover:opacity-90 sm:px-3.5"
          style={{
            backgroundColor: "var(--dash-text)",
            color: "var(--dash-bg)",
          }}
        >
          <IconPlus className="h-3.5 w-3.5" />
          <span className="whitespace-nowrap">Nouveau lead</span>
        </button>

        <button
          type="button"
          onClick={onNewTask}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-opacity hover:opacity-90 sm:px-3.5"
          style={{
            borderColor: "var(--dash-border)",
            backgroundColor: "var(--dash-surface)",
            color: "var(--dash-text)",
          }}
        >
          <IconNewTask />
          <span className="whitespace-nowrap">Nouvelle tâche</span>
        </button>

        <div
          className="ml-auto inline-flex shrink-0 rounded-full border p-0.5"
          style={{
            borderColor: "var(--dash-border)",
            backgroundColor: "var(--dash-surface)",
          }}
          role="group"
          aria-label="Mode d'affichage"
        >
          <ViewToggleButton
            active={viewMode === "kanban"}
            onClick={() => onViewModeChange("kanban")}
          >
            <IconKanban />
            <span className="hidden sm:inline">Kanban</span>
          </ViewToggleButton>
          <ViewToggleButton
            active={viewMode === "list"}
            onClick={() => onViewModeChange("list")}
          >
            <IconList />
            <span className="hidden sm:inline">Liste</span>
          </ViewToggleButton>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 basis-full sm:basis-[220px] sm:max-w-[280px] xl:max-w-[300px]">
          <span
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            style={{ color: "var(--dash-muted)" }}
          >
            <IconSearch />
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Nom, téléphone ou campagne"
            className="h-9 w-full rounded-full border pr-3 pl-9 text-sm outline-none"
            style={{
              backgroundColor: "var(--dash-surface)",
              borderColor: "var(--dash-border)",
              color: "var(--dash-text)",
            }}
          />
        </label>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <FilterDropdown
            ariaLabel="Filtrer par responsable"
            value={ownerFilter}
            onChange={onOwnerFilterChange}
            options={[
              { value: "all", label: "Tous les responsables" },
              { value: "unassigned", label: "Non assigné" },
              ...owners.map((owner) => ({ value: owner, label: owner })),
            ]}
          />

          <FilterDropdown
            ariaLabel="Filtrer par campagne"
            value={campaignFilter}
            onChange={onCampaignFilterChange}
            options={[
              { value: "all", label: "Toutes les campagnes" },
              ...campaigns.map((campaign) => ({
                value: campaign,
                label: campaign,
              })),
            ]}
          />

          <FilterDropdown
            ariaLabel="Filtrer par date"
            value={dateFilter}
            onChange={onDateFilterChange}
            options={[
              { value: "all", label: "Toutes les dates" },
              { value: "today", label: "Aujourd'hui" },
              { value: "week", label: "7 derniers jours" },
              { value: "month", label: "30 derniers jours" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function ViewToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-colors sm:px-3"
      style={
        active
          ? {
              backgroundColor: "var(--dash-nav-active-bg)",
              color: "var(--dash-nav-active-text)",
            }
          : {
              backgroundColor: "transparent",
              color: "var(--dash-muted)",
            }
      }
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
