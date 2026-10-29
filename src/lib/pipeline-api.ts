import { api } from "@/lib/api";
import type {
  LeadActivity,
  LeadActivityKind,
  LeadNote,
  PipelineLead,
  PipelineStage,
  PipelineStageId,
  TaskType,
} from "@/types";

export const pipelineLeadsQueryKey = (pipelineId: string) =>
  ["client", "pipeline", "leads", pipelineId] as const;

export const leadNotesQueryKey = (leadId: string) =>
  ["client", "pipeline", "leads", leadId, "notes"] as const;

export const leadActivityQueryKey = (leadId: string) =>
  ["client", "pipeline", "leads", leadId, "activity"] as const;

/** Fixed Kanban stages — must match NestJS stage ids exactly. */
export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "nouveau",
    label: "Nouveau",
    color: "#8b5cf6",
    tint: "#f1ebfb",
    tintDark: "rgba(139, 92, 246, 0.16)",
  },
  {
    id: "contacte",
    label: "Contacté",
    color: "#a78bfa",
    tint: "#f4effc",
    tintDark: "rgba(167, 139, 250, 0.16)",
  },
  {
    id: "sans_reponse",
    label: "Sans réponse",
    color: "#d4a574",
    tint: "#f7f0e6",
    tintDark: "rgba(212, 165, 116, 0.16)",
  },
  {
    id: "qualifie",
    label: "Qualifié",
    color: "#4ade80",
    tint: "#eaf7ef",
    tintDark: "rgba(74, 222, 128, 0.14)",
  },
  {
    id: "rdv_fixe",
    label: "RDV fixé",
    color: "#2dd4bf",
    tint: "#e7f7f5",
    tintDark: "rgba(45, 212, 191, 0.14)",
  },
  {
    id: "proposition_envoyee",
    label: "Proposition envoyée",
    color: "#f472b6",
    tint: "#fceef5",
    tintDark: "rgba(244, 114, 182, 0.14)",
  },
  {
    id: "gagne",
    label: "Gagné",
    color: "#22c55e",
    tint: "#e9f7ee",
    tintDark: "rgba(34, 197, 94, 0.14)",
  },
  {
    id: "perdu",
    label: "Perdu",
    color: "#9ca3af",
    tint: "#f1f2f4",
    tintDark: "rgba(156, 163, 175, 0.14)",
  },
];

export const REMINDER_ACTIONS: {
  id: TaskType;
  label: string;
}[] = [
  { id: "appel", label: "Appeler le lead" },
  { id: "rendez_vous", label: "Fixer un rendez-vous" },
  { id: "whatsapp", label: "Envoyer un WhatsApp" },
  { id: "relance", label: "Relancer" },
  { id: "devis", label: "Envoyer un devis" },
];

export type CreateLeadInput = {
  name: string;
  phone?: string;
  email?: string;
  campaign?: string;
  estimated_value?: number | null;
  pipeline_id: string;
};

export type UpdateLeadInput = {
  name: string;
  phone?: string;
  email?: string;
  campaign?: string;
  estimated_value?: number | null;
};

const STAGE_IDS = new Set<string>(PIPELINE_STAGES.map((stage) => stage.id));

const ACTIVITY_KINDS = new Set<string>([
  "received",
  "stage_change",
  "note",
  "reminder",
  "owner_change",
]);

function defaultActor() {
  return "Équipe";
}

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

function asNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function asStageId(value: unknown): PipelineStageId {
  const stage = asString(value);
  if (STAGE_IDS.has(stage)) return stage as PipelineStageId;
  throw new Error(`Étape lead invalide: ${stage || "(vide)"}`);
}

function readLead(value: unknown): PipelineLead {
  if (!isRecord(value)) {
    throw new Error("Réponse lead invalide.");
  }

  const id = value.id;
  if (typeof id !== "string" && typeof id !== "number") {
    throw new Error("Réponse lead invalide.");
  }

  const date =
    asString(value.date) ||
    asString(value.created_at) ||
    asString(value.received_at) ||
    new Date().toISOString();

  return {
    id: String(id),
    name: asString(value.name),
    phone: asString(value.phone),
    email: asString(value.email),
    campaign: asString(value.campaign),
    owner: asString(value.owner),
    estimated_value: asNullableNumber(value.estimated_value),
    date,
    stage: asStageId(value.stage),
    pipeline_id: asString(value.pipeline_id || value.pipelineId),
  };
}

function readLeadEntity(data: unknown): PipelineLead {
  if (isRecord(data) && (data.data || data.lead)) {
    const nested = data.data ?? data.lead;
    if (!Array.isArray(nested)) return readLead(nested);
  }
  return readLead(data);
}

function readLeadsPage(data: unknown): {
  data: PipelineLead[];
  total: number;
  page: number;
  limit: number;
} {
  if (Array.isArray(data)) {
    const leads = data.map(readLead);
    return { data: leads, total: leads.length, page: 1, limit: leads.length };
  }

  if (!isRecord(data) || !Array.isArray(data.data)) {
    throw new Error("Réponse leads invalide.");
  }

  const leads = data.data.map(readLead);
  const total =
    typeof data.total === "number" ? data.total : leads.length;
  const page = typeof data.page === "number" ? data.page : 1;
  const limit = typeof data.limit === "number" ? data.limit : leads.length;

  return { data: leads, total, page, limit };
}

function asActivityKind(value: unknown): LeadActivityKind {
  const kind = asString(value);
  if (ACTIVITY_KINDS.has(kind)) return kind as LeadActivityKind;
  throw new Error(`Type d'activité invalide: ${kind || "(vide)"}`);
}

function readNote(value: unknown): LeadNote {
  if (!isRecord(value)) {
    throw new Error("Réponse note invalide.");
  }

  const id = value.id;
  if (typeof id !== "string" && typeof id !== "number") {
    throw new Error("Réponse note invalide.");
  }

  return {
    id: String(id),
    lead_id: asString(value.lead_id || value.leadId),
    author: asString(value.author),
    body: asString(value.body),
    created_at:
      asString(value.created_at) ||
      asString(value.createdAt) ||
      new Date().toISOString(),
  };
}

function readNoteEntity(data: unknown): LeadNote {
  if (isRecord(data) && (data.data || data.note)) {
    const nested = data.data ?? data.note;
    if (!Array.isArray(nested)) return readNote(nested);
  }
  return readNote(data);
}

function readNotesList(data: unknown): LeadNote[] {
  if (Array.isArray(data)) return data.map(readNote);
  if (isRecord(data) && Array.isArray(data.data)) {
    return data.data.map(readNote);
  }
  throw new Error("Réponse notes invalide.");
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

/** French label for an activity kind (Suivi timeline). */
export function activityKindLabel(kind: LeadActivityKind): string {
  switch (kind) {
    case "received":
      return "Réception";
    case "stage_change":
      return "Changement d'étape";
    case "note":
      return "Note";
    case "reminder":
      return "Rappel";
    case "owner_change":
      return "Responsable";
    default:
      return kind;
  }
}

export async function fetchPipelineLeads(
  pipelineId: string,
): Promise<PipelineLead[]> {
  const limit = 100;
  let page = 1;
  let total = Infinity;
  const all: PipelineLead[] = [];

  while (all.length < total) {
    const params: Record<string, string | number> = { page, limit };
    if (pipelineId && pipelineId !== "all") {
      params.pipeline_id = pipelineId;
    }

    const { data } = await api.get<unknown>("/client/leads", { params });
    const pageResult = readLeadsPage(data);
    all.push(...pageResult.data);
    total = pageResult.total;

    if (pageResult.data.length === 0) break;
    page += 1;
    if (page > 50) break;
  }

  return all;
}

export async function createLead(input: CreateLeadInput): Promise<PipelineLead> {
  const { data } = await api.post<unknown>("/client/leads", {
    name: input.name.trim(),
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    campaign: input.campaign?.trim() || undefined,
    estimated_value:
      typeof input.estimated_value === "number" &&
      !Number.isNaN(input.estimated_value)
        ? input.estimated_value
        : null,
    pipeline_id: input.pipeline_id,
  });
  return readLeadEntity(data);
}

export async function updateLeadStage(
  leadId: string,
  newStage: PipelineStageId,
  _actor = defaultActor(),
): Promise<PipelineLead> {
  const { data } = await api.patch<unknown>(`/client/leads/${leadId}/stage`, {
    stage: newStage,
  });
  return readLeadEntity(data);
}

export async function updateLead(
  leadId: string,
  input: UpdateLeadInput,
  _actor = defaultActor(),
): Promise<PipelineLead> {
  const { data } = await api.patch<unknown>(`/client/leads/${leadId}`, {
    name: input.name.trim(),
    phone: input.phone?.trim() ?? "",
    email: input.email?.trim() ?? "",
    campaign: input.campaign?.trim() ?? "",
    estimated_value:
      typeof input.estimated_value === "number" &&
      !Number.isNaN(input.estimated_value)
        ? input.estimated_value
        : null,
  });
  return readLeadEntity(data);
}

export async function updateLeadOwner(
  leadId: string,
  owner: string,
  _actor = defaultActor(),
): Promise<PipelineLead> {
  const { data } = await api.patch<unknown>(`/client/leads/${leadId}/owner`, {
    owner: owner.trim(),
  });
  return readLeadEntity(data);
}

export async function deleteLead(leadId: string): Promise<void> {
  await api.delete(`/client/leads/${leadId}`);
}

export async function fetchLeadNotes(leadId: string): Promise<LeadNote[]> {
  const { data } = await api.get<unknown>(`/client/leads/${leadId}/notes`);
  return readNotesList(data);
}

export async function addLeadNote(
  leadId: string,
  body: string,
  _actor = defaultActor(),
): Promise<LeadNote> {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("La note est vide.");
  }

  const { data } = await api.post<unknown>(`/client/leads/${leadId}/notes`, {
    body: trimmed,
  });
  return readNoteEntity(data);
}

export async function fetchLeadActivity(
  leadId: string,
): Promise<LeadActivity[]> {
  const { data } = await api.get<unknown>(`/client/leads/${leadId}/activity`);
  return readActivityList(data);
}

export type ScheduleLeadReminderInput = {
  leadId: string;
  /** Kept for callers; reminder task is created server-side. */
  leadName?: string;
  phone?: string;
  pipelineId?: string;
  /** Must be: appel | rendez_vous | whatsapp | relance | devis */
  taskType: TaskType;
  dueAt: string;
  details?: string;
  actor?: string;
};

export async function scheduleLeadReminder(
  input: ScheduleLeadReminderInput,
): Promise<void> {
  await api.post(`/client/leads/${input.leadId}/reminders`, {
    taskType: input.taskType,
    dueAt: input.dueAt,
    details: input.details?.trim() || undefined,
  });
}

export function getStageById(id: PipelineStage["id"]) {
  return PIPELINE_STAGES.find((stage) => stage.id === id);
}

export function getStageIndex(id: PipelineStageId) {
  return PIPELINE_STAGES.findIndex((stage) => stage.id === id);
}

/** Stages before the current one are treated as already completed. */
export function isStageCompleted(
  stageId: PipelineStageId,
  currentStageId: PipelineStageId,
) {
  const stageIndex = getStageIndex(stageId);
  const currentIndex = getStageIndex(currentStageId);
  if (stageIndex < 0 || currentIndex < 0) return false;
  return stageIndex < currentIndex;
}

/** Minutes between lead receipt and first move out of « Nouveau ». */
export function firstContactAfterMinutes(
  lead: PipelineLead,
  activities: LeadActivity[],
) {
  if (lead.stage === "nouveau") return 0;

  const receivedAt = new Date(lead.date).getTime();
  if (Number.isNaN(receivedAt)) return 0;

  const firstMove = [...activities]
    .filter((item) => item.kind === "stage_change")
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )[0];

  const contactAt = firstMove
    ? new Date(firstMove.created_at).getTime()
    : Date.now();

  if (Number.isNaN(contactAt) || contactAt < receivedAt) return 0;
  return Math.max(0, Math.round((contactAt - receivedAt) / 60000));
}
