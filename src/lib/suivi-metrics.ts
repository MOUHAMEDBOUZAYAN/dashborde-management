import { firstContactAfterMinutes } from "@/lib/pipeline-api";
import { isTaskOverdue } from "@/lib/tasks-api";
import type { LeadActivity, PipelineLead, Task } from "@/types";

export const CONTACT_THRESHOLD_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 h" },
  { value: 120, label: "2 h" },
  { value: 1440, label: "24 h" },
] as const;

export type ContactThresholdMinutes =
  (typeof CONTACT_THRESHOLD_OPTIONS)[number]["value"];

export function leadsWaitingContact(leads: PipelineLead[]) {
  return leads.filter((lead) => lead.stage === "nouveau");
}

/** Leads still in Nouveau past the contact SLA. */
export function leadsOverdueForContact(
  leads: PipelineLead[],
  thresholdMinutes: number,
  now = Date.now(),
) {
  const thresholdMs = thresholdMinutes * 60_000;
  return leadsWaitingContact(leads).filter((lead) => {
    const received = new Date(lead.date).getTime();
    if (Number.isNaN(received)) return false;
    return now - received >= thresholdMs;
  });
}

export function averageFirstContactMinutes(
  leads: PipelineLead[],
  activities: LeadActivity[],
) {
  const samples = leads
    .filter((lead) => lead.stage !== "nouveau")
    .map((lead) =>
      firstContactAfterMinutes(
        lead,
        activities.filter((item) => item.lead_id === lead.id),
      ),
    )
    .filter((minutes) => minutes > 0);

  if (samples.length === 0) return 0;
  return Math.round(
    samples.reduce((sum, value) => sum + value, 0) / samples.length,
  );
}

export function overdueTasks(tasks: Task[], now = Date.now()) {
  return tasks
    .filter((task) => isTaskOverdue(task, now))
    .sort((a, b) => {
      const aDue = a.due_at ? new Date(a.due_at).getTime() : 0;
      const bDue = b.due_at ? new Date(b.due_at).getTime() : 0;
      return aDue - bDue;
    });
}
