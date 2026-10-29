import type { PipelineLead, PipelineStageId } from "@/types";

export type LeadListFilters = {
  pipelineId: "all" | string;
  search: string;
  ownerFilter: string;
  campaignFilter: string;
  dateFilter: string;
  stageFilter?: "all" | PipelineStageId;
};

export function filterLeads(
  leads: PipelineLead[],
  {
    pipelineId,
    search,
    ownerFilter,
    campaignFilter,
    dateFilter,
    stageFilter = "all",
  }: LeadListFilters,
) {
  const query = search.trim().toLowerCase();
  const now = Date.now();

  return leads.filter((lead) => {
    if (pipelineId !== "all" && lead.pipeline_id !== pipelineId) return false;
    if (stageFilter !== "all" && lead.stage !== stageFilter) return false;

    if (ownerFilter === "unassigned") {
      if (lead.owner.trim()) return false;
    } else if (ownerFilter !== "all" && lead.owner !== ownerFilter) {
      return false;
    }

    if (campaignFilter !== "all" && lead.campaign !== campaignFilter) {
      return false;
    }

    if (dateFilter !== "all") {
      const leadTime = new Date(lead.date).getTime();
      if (Number.isNaN(leadTime)) return false;
      const dayMs = 24 * 60 * 60 * 1000;
      if (dateFilter === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        if (leadTime < start.getTime()) return false;
      } else if (dateFilter === "week" && leadTime < now - 7 * dayMs) {
        return false;
      } else if (dateFilter === "month" && leadTime < now - 30 * dayMs) {
        return false;
      }
    }

    if (!query) return true;
    return (
      lead.name.toLowerCase().includes(query) ||
      lead.phone.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      lead.campaign.toLowerCase().includes(query)
    );
  });
}
