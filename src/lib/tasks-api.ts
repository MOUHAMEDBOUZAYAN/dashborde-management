import { api } from "@/lib/api";
import type { Task, TaskStatus, TaskType } from "@/types";

export { fetchPipelines, pipelinesQueryKey } from "@/lib/pipelines-api";

export const tasksQueryKey = ["client", "tasks"] as const;

export const TASK_TYPE_OPTIONS: {
  id: TaskType;
  label: string;
}[] = [
  { id: "appel", label: "Appel" },
  { id: "rendez_vous", label: "Rendez-vous" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "relance", label: "Relance" },
  { id: "devis", label: "Envoyer un devis" },
];

export type CreateTaskInput = {
  lead_id: string;
  lead_name: string;
  phone: string;
  pipeline_id: string;
  task_type: TaskType;
  due_at: string;
  details?: string;
};

export type FetchTasksParams = {
  status?: TaskStatus;
  pipeline_id?: string;
};

const TASK_TYPES = new Set<string>(TASK_TYPE_OPTIONS.map((item) => item.id));
const TASK_STATUSES = new Set<string>(["pending", "done", "cancelled"]);

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

function asTaskType(value: unknown): TaskType {
  const type = asString(value);
  if (TASK_TYPES.has(type)) return type as TaskType;
  throw new Error(`Type de tâche invalide: ${type || "(vide)"}`);
}

function asTaskStatus(value: unknown): TaskStatus {
  const status = asString(value);
  if (TASK_STATUSES.has(status)) return status as TaskStatus;
  throw new Error(`Statut de tâche invalide: ${status || "(vide)"}`);
}

function readTask(value: unknown): Task {
  if (!isRecord(value)) {
    throw new Error("Réponse tâche invalide.");
  }

  const id = value.id;
  if (typeof id !== "string" && typeof id !== "number") {
    throw new Error("Réponse tâche invalide.");
  }

  const leadIdRaw = value.lead_id ?? value.leadId;
  const lead_id =
    leadIdRaw == null || leadIdRaw === ""
      ? null
      : asString(leadIdRaw);

  const dueRaw = value.due_at ?? value.dueAt;
  const due_at =
    dueRaw == null || dueRaw === "" ? null : asString(dueRaw);

  return {
    id: String(id),
    title: asString(value.title),
    lead_name: asString(value.lead_name ?? value.leadName),
    phone: asString(value.phone),
    pipeline_id: asString(value.pipeline_id ?? value.pipelineId),
    lead_id,
    task_type: asTaskType(value.task_type ?? value.taskType),
    details: value.details == null ? "" : asString(value.details),
    status: asTaskStatus(value.status),
    due_at,
  };
}

function readTaskEntity(data: unknown): Task {
  if (isRecord(data) && (data.data || data.task)) {
    const nested = data.data ?? data.task;
    if (!Array.isArray(nested)) return readTask(nested);
  }
  return readTask(data);
}

function readTasksList(data: unknown): Task[] {
  if (Array.isArray(data)) return data.map(readTask);
  if (isRecord(data) && Array.isArray(data.data)) {
    return data.data.map(readTask);
  }
  throw new Error("Réponse tâches invalide.");
}

export async function fetchTasks(
  params?: FetchTasksParams,
): Promise<Task[]> {
  const query: Record<string, string> = {};
  if (params?.status) query.status = params.status;
  if (params?.pipeline_id && params.pipeline_id !== "all") {
    query.pipeline_id = params.pipeline_id;
  }

  const { data } = await api.get<unknown>("/client/tasks", {
    params: Object.keys(query).length > 0 ? query : undefined,
  });
  return readTasksList(data);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data } = await api.post<unknown>("/client/tasks", {
    lead_id: input.lead_id,
    lead_name: input.lead_name.trim(),
    phone: input.phone.trim(),
    pipeline_id: input.pipeline_id,
    task_type: input.task_type,
    due_at: input.due_at,
    details: input.details?.trim() || undefined,
  });
  return readTaskEntity(data);
}

export async function remindTask(taskId: string): Promise<Task> {
  const { data } = await api.patch<unknown>(
    `/client/tasks/${taskId}/remind`,
  );
  return readTaskEntity(data);
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<Task> {
  const { data } = await api.patch<unknown>(
    `/client/tasks/${taskId}/status`,
    { status },
  );
  return readTaskEntity(data);
}

export function isTaskOverdue(task: Task, now = Date.now()) {
  if (task.status !== "pending" || !task.due_at) return false;
  const due = new Date(task.due_at).getTime();
  return !Number.isNaN(due) && due < now;
}
