"use client";

import { FilterDropdown } from "@/components/dashboard/filter-dropdown";
import { IconPlus, IconSearch } from "@/components/layout/nav-icons";
import { PIPELINE_STAGES } from "@/lib/pipeline-api";
import type { PipelineStageId } from "@/types";

type LeadsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
  campaignFilter: string;
  onCampaignFilterChange: (value: string) => void;
  stageFilter: "all" | PipelineStageId;
  onStageFilterChange: (value: "all" | PipelineStageId) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  owners: string[];
  campaigns: string[];
  onNewLead: () => void;
};

export function LeadsToolbar({
  search,
  onSearchChange,
  ownerFilter,
  onOwnerFilterChange,
  campaignFilter,
  onCampaignFilterChange,
  stageFilter,
  onStageFilterChange,
  dateFilter,
  onDateFilterChange,
  owners,
  campaigns,
  onNewLead,
}: LeadsToolbarProps) {
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
            placeholder="Nom, téléphone, email ou campagne"
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
            ariaLabel="Filtrer par étape"
            value={stageFilter}
            onChange={(value) =>
              onStageFilterChange(value as "all" | PipelineStageId)
            }
            options={[
              { value: "all", label: "Toutes les étapes" },
              ...PIPELINE_STAGES.map((stage) => ({
                value: stage.id,
                label: stage.label,
              })),
            ]}
          />

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
