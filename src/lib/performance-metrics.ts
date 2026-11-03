import { firstContactAfterMinutes } from "@/lib/pipeline-api";
import { isTaskOverdue } from "@/lib/tasks-api";
import type { LeadActivity, PipelineLead, Task, TeamMember } from "@/types";

export type PerformancePeriod = 7 | 30 | "all";

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

export type MemberScoreCard = {
  key: string;
  name: string;
  email?: string;
  isYou: boolean;
  score: number;
  label: string;
  assigned: number;
  firstContactAvgMinutes: number;
  tasksDone: number;
  onTimePercent: number;
  overdue: number;
};

export type TeamPerformanceSummary = {
  totalLeads: number;
  won: number;
  lost: number;
  inProgress: number;
  conversionRate: number;
  estimatedWonValue: number;
  tasksPending: number;
  tasksDone: number;
};

function isWon(lead: PipelineLead) {
  return lead.stage === "gagne";
}

function isLost(lead: PipelineLead) {
  return lead.stage === "perdu";
}

function isInProgress(lead: PipelineLead) {
  return !isWon(lead) && !isLost(lead);
}

export function summarizeTeamPerformance(
  leads: PipelineLead[],
  tasks: Task[],
): TeamPerformanceSummary {
  const won = leads.filter(isWon).length;
  const lost = leads.filter(isLost).length;
  const closed = won + lost;
  const estimatedWonValue = leads
    .filter(isWon)
    .reduce((sum, lead) => sum + (lead.estimated_value ?? 0), 0);

  return {
    totalLeads: leads.length,
    won,
    lost,
    inProgress: leads.filter(isInProgress).length,
    conversionRate: closed === 0 ? 0 : Math.round((won / closed) * 100),
    estimatedWonValue,
    tasksPending: tasks.filter((task) => task.status === "pending").length,
    tasksDone: tasks.filter((task) => task.status === "done").length,
  };
}

export function buildMemberPerformanceRows(
  members: TeamMember[],
  leads: PipelineLead[],
  tasks: Task[],
): MemberPerformance[] {
  const rows = members.map((member) => {
    const memberLeads = leads.filter(
      (lead) => lead.owner.trim() === member.name.trim(),
    );
    return scoreMember({
      key: member.id,
      name: member.name,
      email: member.email,
      roleLabel: member.role === "owner" ? "Propriétaire" : "Membre",
      leads: memberLeads,
      tasks: tasks.filter((task) => {
        if (!task.lead_id) return false;
        return memberLeads.some((lead) => lead.id === task.lead_id);
      }),
    });
  });

  const assignedNames = new Set(members.map((member) => member.name.trim()));
  const unassignedLeads = leads.filter(
    (lead) => !lead.owner.trim() || !assignedNames.has(lead.owner.trim()),
  );

  if (unassignedLeads.length > 0) {
    rows.push(
      scoreMember({
        key: "unassigned",
        name: "Non assigné",
        roleLabel: "—",
        leads: unassignedLeads,
        tasks: tasks.filter((task) => {
          if (!task.lead_id) return true;
          return unassignedLeads.some((lead) => lead.id === task.lead_id);
        }),
      }),
    );
  }

  return rows.sort((a, b) => b.won - a.won || b.leadsAssigned - a.leadsAssigned);
}

function scoreMember({
  key,
  name,
  email,
  roleLabel,
  leads,
  tasks,
}: {
  key: string;
  name: string;
  email?: string;
  roleLabel: string;
  leads: PipelineLead[];
  tasks: Task[];
}): MemberPerformance {
  const won = leads.filter(isWon).length;
  const lost = leads.filter(isLost).length;
  const closed = won + lost;

  return {
    key,
    name,
    email,
    roleLabel,
    leadsAssigned: leads.length,
    inProgress: leads.filter(isInProgress).length,
    won,
    lost,
    conversionRate: closed === 0 ? 0 : Math.round((won / closed) * 100),
    estimatedWonValue: leads
      .filter(isWon)
      .reduce((sum, lead) => sum + (lead.estimated_value ?? 0), 0),
    tasksPending: tasks.filter((task) => task.status === "pending").length,
    tasksDone: tasks.filter((task) => task.status === "done").length,
  };
}

export function formatMad(value: number) {
  if (!value) return "0 MAD";
  return `${new Intl.NumberFormat("fr-MA", {
    maximumFractionDigits: 0,
  }).format(value)} MAD`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function withinPeriod(iso: string | null | undefined, cutoff: number | null) {
  if (cutoff == null) return true;
  if (!iso) return false;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return false;
  return time >= cutoff;
}

export function periodCutoff(
  period: PerformancePeriod,
  now = Date.now(),
): number | null {
  if (period === "all") return null;
  return now - period * 24 * 60 * 60 * 1000;
}

export function scoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 55) return "Correct";
  if (score >= 35) return "À améliorer";
  return "Critique";
}

/** Score 0–100 from first-contact speed, on-time tasks, and overdue count. */
export function computeMemberScore({
  firstContactAvgMinutes,
  onTimePercent,
  overdue,
  tasksDone,
}: {
  firstContactAvgMinutes: number;
  onTimePercent: number;
  overdue: number;
  tasksDone: number;
}) {
  let score = 60;

  if (firstContactAvgMinutes > 0) {
    if (firstContactAvgMinutes <= 30) score += 20;
    else if (firstContactAvgMinutes <= 60) score += 10;
    else if (firstContactAvgMinutes <= 120) score -= 5;
    else score -= 15;
  }

  score += Math.round((onTimePercent - 50) * 0.35);
  score -= overdue * 8;
  if (tasksDone > 0) score += Math.min(12, tasksDone * 2);

  return clamp(Math.round(score), 0, 100);
}

export function buildMemberScoreCards({
  members,
  leads,
  tasks,
  activities,
  youEmail,
  period = "all",
  now = Date.now(),
}: {
  members: Array<Pick<TeamMember, "id" | "name" | "email" | "role" | "is_you">>;
  leads: PipelineLead[];
  tasks: Task[];
  activities: LeadActivity[];
  youEmail?: string | null;
  period?: PerformancePeriod;
  now?: number;
}): MemberScoreCard[] {
  const cutoff = periodCutoff(period, now);
  const scopedLeads = leads.filter((lead) => withinPeriod(lead.date, cutoff));
  const scopedTasks = tasks.filter(
    (task) =>
      withinPeriod(task.due_at, cutoff) ||
      // Keep pending overdue tasks visible even if due before the window.
      isTaskOverdue(task, now),
  );

  const you = (youEmail ?? "").trim().toLowerCase();

  const cards = members
    .filter((member) => member.role === "owner" || member.role === "member")
    .map((member) => {
      const memberLeads = scopedLeads.filter(
        (lead) => lead.owner.trim() === member.name.trim(),
      );
      const leadIds = new Set(memberLeads.map((lead) => lead.id));
      const memberTasks = scopedTasks.filter(
        (task) => task.lead_id && leadIds.has(task.lead_id),
      );

      const contactSamples = memberLeads
        .filter((lead) => lead.stage !== "nouveau")
        .map((lead) =>
          firstContactAfterMinutes(
            lead,
            activities.filter((item) => item.lead_id === lead.id),
          ),
        )
        .filter((minutes) => minutes > 0);

      const firstContactAvgMinutes =
        contactSamples.length === 0
          ? 0
          : Math.round(
              contactSamples.reduce((sum, value) => sum + value, 0) /
                contactSamples.length,
            );

      const done = memberTasks.filter((task) => task.status === "done");
      const overdue = memberTasks.filter((task) =>
        isTaskOverdue(task, now),
      ).length;
      const onTimePercent =
        memberTasks.length === 0
          ? 0
          : Math.round(
              ((memberTasks.length - overdue) / memberTasks.length) * 100,
            );

      const score = computeMemberScore({
        firstContactAvgMinutes,
        onTimePercent,
        overdue,
        tasksDone: done.length,
      });

      const email = member.email?.trim();
      const isYou =
        Boolean(member.is_you) ||
        (Boolean(you) && Boolean(email) && email!.toLowerCase() === you);

      return {
        key: member.id,
        name: member.name,
        email,
        isYou,
        score,
        label: scoreLabel(score),
        assigned: memberLeads.length,
        firstContactAvgMinutes,
        tasksDone: done.length,
        onTimePercent,
        overdue,
      } satisfies MemberScoreCard;
    });

  return cards.sort(
    (a, b) => Number(b.isYou) - Number(a.isYou) || b.score - a.score,
  );
}
