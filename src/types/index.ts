/** Logged-in portal client, from GET /client-auth/me. */
export type Client = {
  id: string;
  company_name: string;
  email: string;
};

export type TeamMemberRole = "owner" | "member";

/** Collaborator on the client account (Équipe). */
export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  /** True for the logged-in account owner row. */
  is_you?: boolean;
};

/** A lead visible to a single client. */
export type Lead = {
  id: string;
  clientId: string;
  title: string;
  status: string;
};

export type Pipeline = {
  id: string;
  name: string;
  color: string;
};

export type PipelineStageId =
  | "nouveau"
  | "contacte"
  | "sans_reponse"
  | "qualifie"
  | "rdv_fixe"
  | "proposition_envoyee"
  | "gagne"
  | "perdu";

export type PipelineStage = {
  id: PipelineStageId;
  label: string;
  color: string;
  /** Soft column fill (light mode). */
  tint: string;
  /** Soft column fill (dark mode). */
  tintDark: string;
};

/** Lead card on the Pipeline Kanban / Liste views. */
export type PipelineLead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  campaign: string;
  owner: string;
  estimated_value: number | null;
  date: string;
  stage: PipelineStageId;
  pipeline_id: string;
};

export type LeadNote = {
  id: string;
  lead_id: string;
  author: string;
  body: string;
  created_at: string;
};

export type LeadActivityKind =
  | "received"
  | "stage_change"
  | "note"
  | "reminder"
  | "owner_change";

export type LeadActivity = {
  id: string;
  lead_id: string;
  kind: LeadActivityKind;
  actor: string;
  message: string;
  detail?: string;
  created_at: string;
};

export type TaskStatus = "pending" | "done" | "cancelled";

export type TaskType =
  | "appel"
  | "rendez_vous"
  | "whatsapp"
  | "relance"
  | "devis";

/** Call/follow-up task shown on Mes tâches. */
export type Task = {
  id: string;
  title: string;
  lead_name: string;
  phone: string;
  pipeline_id: string;
  lead_id: string | null;
  task_type: TaskType;
  details: string;
  status: TaskStatus;
  due_at: string | null;
};
