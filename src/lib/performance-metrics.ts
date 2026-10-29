import type { PipelineLead, Task, TeamMember } from "@/types";

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
