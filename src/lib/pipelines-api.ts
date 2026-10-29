import { api } from "@/lib/api";
import type { Pipeline } from "@/types";

export const pipelinesQueryKey = ["client", "pipelines"] as const;

export const PIPELINE_COLORS = [
  "#c4a574",
  "#4ade80",
  "#a78bfa",
  "#f472b6",
  "#facc15",
  "#fb923c",
] as const;

export type PipelineInput = {
  name: string;
  color: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readPipeline(value: unknown): Pipeline {
  if (!isRecord(value)) {
    throw new Error("Réponse pipeline invalide.");
  }

  const id = value.id;
  const name = value.name;
  const color = value.color;

  if (
    (typeof id !== "string" && typeof id !== "number") ||
    typeof name !== "string" ||
    typeof color !== "string"
  ) {
    throw new Error("Réponse pipeline invalide.");
  }

  return {
    id: String(id),
    name,
    color,
  };
}

function readPipelineList(data: unknown): Pipeline[] {
  if (Array.isArray(data)) {
    return data.map(readPipeline);
  }

  if (isRecord(data)) {
    const nested = data.data ?? data.pipelines ?? data.items;
    if (Array.isArray(nested)) {
      return nested.map(readPipeline);
    }
  }

  throw new Error("Réponse pipelines invalide.");
}

function readPipelineEntity(data: unknown): Pipeline {
  if (isRecord(data) && (data.data || data.pipeline)) {
    return readPipeline(data.data ?? data.pipeline);
  }
  return readPipeline(data);
}

export async function fetchPipelines(): Promise<Pipeline[]> {
  const { data } = await api.get<unknown>("/client/pipelines");
  return readPipelineList(data);
}

export async function createPipeline(input: PipelineInput): Promise<Pipeline> {
  const { data } = await api.post<unknown>("/client/pipelines", {
    name: input.name.trim(),
    color: input.color,
  });
  return readPipelineEntity(data);
}

export async function updatePipeline(
  id: string,
  input: PipelineInput,
): Promise<Pipeline> {
  const { data } = await api.patch<unknown>(`/client/pipelines/${id}`, {
    name: input.name.trim(),
    color: input.color,
  });
  return readPipelineEntity(data);
}

export async function deletePipeline(id: string): Promise<void> {
  await api.delete(`/client/pipelines/${id}`);
}
