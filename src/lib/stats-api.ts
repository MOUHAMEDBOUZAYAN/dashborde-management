import { api } from "@/lib/api";
import type { LeadActivity, LeadActivityKind } from "@/types";

export const suiviStatsQueryKey = (thresholdMinutes: number) =>
  ["client", "stats", "suivi", thresholdMinutes] as const;

export const performanceStatsQueryKey = [
  "client",
  "stats",
  "performance",
] as const;

export const overviewStatsQueryKey = ["client", "stats", "overview"] as const;

export const allLeadActivitiesQueryKey = ["client", "activity", "all"] as const;

export type SuiviStats = {
  waiting_leads: number;
  contact_overdue: number;
  threshold_minutes: number;
  first_contact_avg_minutes: number;
  overdue_tasks: number;
  reminders_last_24h: number;
};

export type PerformanceTotals = {
  totalLeads: number;
  won: number;
  lost: number;
  inProgress: number;
  conversionRate: number;
  estimatedWonValue: number;
  tasksPending: number;
  tasksDone: number;
};

export type MemberPerformance = {
  key: string;
  name: string;
  email?: string;
  roleLabel: string;
  leadsAssigned: number;
  inProgress: number;
  won: number;
  lost: number;
  conversionRate: number;
  estimatedWonValue: number;
  tasksPending: number;
  tasksDone: number;
};

export type PerformanceStats = {
  totals: PerformanceTotals;
  team: MemberPerformance[];
};

export type OverviewStats = {
  total_leads: number;
  by_stage: Record<string, number>;
  new_this_week: number;
  pending_tasks: number;
  overdue_tasks: number;
  total_estimated_value: number;
  won_value: number;
};

const ACTIVITY_KINDS = new Set<string>([
  "received",
  "stage_change",
  "note",
  "reminder",
  "owner_change",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function asActivityKind(value: unknown): LeadActivityKind {
  const kind = asString(value);
  if (ACTIVITY_KINDS.has(kind)) return kind as LeadActivityKind;
  throw new Error(`Type d'activité invalide: ${kind || "(vide)"}`);
}

function readSuiviStats(data: unknown): SuiviStats {
  if (!isRecord(data)) throw new Error("Réponse stats suivi invalide.");
  return {
    waiting_leads: asNumber(data.waiting_leads),
    contact_overdue: asNumber(data.contact_overdue),
    threshold_minutes: asNumber(data.threshold_minutes, 30),
    first_contact_avg_minutes: asNumber(data.first_contact_avg_minutes),
    overdue_tasks: asNumber(data.overdue_tasks),
    reminders_last_24h: asNumber(data.reminders_last_24h),
  };
}

function readMemberPerformance(value: unknown): MemberPerformance {
  if (!isRecord(value)) {
    throw new Error("Réponse performance membre invalide.");
  }

  const emailRaw = value.email;
  const email =
    emailRaw == null || emailRaw === ""
      ? undefined
      : asString(emailRaw);

  return {
    key: asString(value.key || value.id),
    name: asString(value.name),
    email,
    roleLabel: asString(value.roleLabel || value.role_label, "—"),
    leadsAssigned: asNumber(value.leadsAssigned ?? value.leads_assigned),
    inProgress: asNumber(value.inProgress ?? value.in_progress),
    won: asNumber(value.won),
    lost: asNumber(value.lost),
    conversionRate: asNumber(value.conversionRate ?? value.conversion_rate),
    estimatedWonValue: asNumber(
      value.estimatedWonValue ?? value.estimated_won_value,
    ),
    tasksPending: asNumber(value.tasksPending ?? value.tasks_pending),
    tasksDone: asNumber(value.tasksDone ?? value.tasks_done),
  };
}

function readPerformanceStats(data: unknown): PerformanceStats {
  if (!isRecord(data)) throw new Error("Réponse stats performance invalide.");

  const totalsRaw = data.totals;
  if (!isRecord(totalsRaw)) {
    throw new Error("Réponse stats performance invalide.");
  }

  const teamRaw = data.team;
  if (!Array.isArray(teamRaw)) {
    throw new Error("Réponse stats performance invalide.");
  }

  return {
    totals: {
      totalLeads: asNumber(totalsRaw.totalLeads ?? totalsRaw.total_leads),
      won: asNumber(totalsRaw.won),
      lost: asNumber(totalsRaw.lost),
      inProgress: asNumber(totalsRaw.inProgress ?? totalsRaw.in_progress),
      conversionRate: asNumber(
        totalsRaw.conversionRate ?? totalsRaw.conversion_rate,
      ),
      estimatedWonValue: asNumber(
        totalsRaw.estimatedWonValue ?? totalsRaw.estimated_won_value,
      ),
      tasksPending: asNumber(
        totalsRaw.tasksPending ?? totalsRaw.tasks_pending,
      ),
      tasksDone: asNumber(totalsRaw.tasksDone ?? totalsRaw.tasks_done),
    },
    team: teamRaw.map(readMemberPerformance),
  };
}

function readOverviewStats(data: unknown): OverviewStats {
  if (!isRecord(data)) throw new Error("Réponse stats overview invalide.");

  const byStageRaw = data.by_stage;
  const by_stage: Record<string, number> = {};
  if (isRecord(byStageRaw)) {
    for (const [key, value] of Object.entries(byStageRaw)) {
      by_stage[key] = asNumber(value);
    }
  }

  return {
    total_leads: asNumber(data.total_leads),
    by_stage,
    new_this_week: asNumber(data.new_this_week),
    pending_tasks: asNumber(data.pending_tasks),
    overdue_tasks: asNumber(data.overdue_tasks),
    total_estimated_value: asNumber(data.total_estimated_value),
    won_value: asNumber(data.won_value),
  };
}

function readActivity(value: unknown): LeadActivity {
  if (!isRecord(value)) {
    throw new Error("Réponse activité invalide.");
  }

  const id = value.id;
  if (typeof id !== "string" && typeof id !== "number") {
    throw new Error("Réponse activité invalide.");
  }

  const detailRaw = value.detail;
  const detail =
    detailRaw == null || detailRaw === ""
      ? undefined
      : asString(detailRaw);

  return {
    id: String(id),
    lead_id: asString(value.lead_id || value.leadId),
    kind: asActivityKind(value.kind),
    actor: asString(value.actor),
    message: asString(value.message),
    detail,
    created_at:
      asString(value.created_at) ||
      asString(value.createdAt) ||
      new Date().toISOString(),
  };
}

function readActivityList(data: unknown): LeadActivity[] {
  if (Array.isArray(data)) return data.map(readActivity);
  if (isRecord(data) && Array.isArray(data.data)) {
    return data.data.map(readActivity);
  }
  throw new Error("Réponse activité invalide.");
}

export async function fetchSuiviStats(
  thresholdMinutes = 30,
): Promise<SuiviStats> {
  const { data } = await api.get<unknown>("/client/stats/suivi", {
    params: { threshold_minutes: thresholdMinutes },
  });
  return readSuiviStats(data);
}

export async function fetchPerformance(): Promise<PerformanceStats> {
  const { data } = await api.get<unknown>("/client/stats/performance");
  return readPerformanceStats(data);
}

export async function fetchOverviewStats(): Promise<OverviewStats> {
  const { data } = await api.get<unknown>("/client/stats/overview");
  return readOverviewStats(data);
}

export async function fetchAllLeadActivities(
  limit = 100,
): Promise<LeadActivity[]> {
  const { data } = await api.get<unknown>("/client/activity", {
    params: { limit },
  });
  return readActivityList(data);
}

/** Invalidate Suivi / Performance / activity queries after lead or task changes. */
export async function invalidateClientStats(
  queryClient: {
    invalidateQueries: (opts: { queryKey: readonly unknown[] }) => Promise<unknown>;
  },
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["client", "stats"] }),
    queryClient.invalidateQueries({ queryKey: allLeadActivitiesQueryKey }),
  ]);
}
