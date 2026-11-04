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
    <div className="flex min-w-0 flex-col gap-2 xl:flex-row xl:items-center xl:gap-3">
      <div className="dash-h-scroll flex min-w-0 shrink-0 items-center gap-2 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={onNewLead}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-opacity hover:opacity-90 sm:px-3.5"
          style={{
            backgroundColor: "var(--dash-text)",
            color: "var(--dash-bg)",
          }}
        >
          <IconPlus className="h-3.5 w-3.5" />
          <span className="whitespace-nowrap">
            <span className="sm:hidden">Lead</span>
            <span className="hidden sm:inline">Nouveau lead</span>
          </span>
        </button>

        <button
          type="button"
          onClick={onNewTask}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-opacity hover:opacity-90 sm:px-3.5"
          style={{
            borderColor: "var(--dash-border)",
            backgroundColor: "transparent",
            color: "var(--dash-text)",
          }}
        >
          <IconNewTask />
          <span className="whitespace-nowrap">
            <span className="sm:hidden">Tâche</span>
            <span className="hidden sm:inline">Nouvelle tâche</span>
          </span>
        </button>
      </div>

      <div className="dash-h-scroll flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-0.5">
        <label className="relative min-w-[200px] max-w-[280px] flex-1">
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
              backgroundColor: "transparent",
              borderColor: "var(--dash-border)",
              color: "var(--dash-text)",
            }}
          />
        </label>

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

      <div
        className="inline-flex shrink-0 self-end rounded-full border p-0.5 xl:self-auto"
        style={{
          borderColor: "var(--dash-border)",
          backgroundColor: "transparent",
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
