import { api } from "@/lib/api";
import type { TeamMember, TeamMemberRole } from "@/types";

export const teamMembersQueryKey = ["client", "team", "members"] as const;

export type CreateTeamMemberInput = {
  name: string;
  email: string;
  password: string;
};

export type UpdateTeamMemberInput = {
  name?: string;
  email?: string;
  password?: string;
};

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

function asRole(value: unknown): TeamMemberRole {
  const role = asString(value);
  if (role === "owner" || role === "member") return role;
  throw new Error(`Rôle invalide: ${role || "(vide)"}`);
}

function readMember(value: unknown): TeamMember {
  if (!isRecord(value)) {
    throw new Error("Réponse membre invalide.");
  }

  const id = value.id;
  if (typeof id !== "string" && typeof id !== "number") {
    throw new Error("Réponse membre invalide.");
  }

  const member: TeamMember = {
    id: String(id),
    name: asString(value.name),
    email: asString(value.email),
    role: asRole(value.role),
  };

  if (typeof value.is_you === "boolean") {
    member.is_you = value.is_you;
  } else if (typeof value.isYou === "boolean") {
    member.is_you = value.isYou;
  }

  return member;
}

function readMemberEntity(data: unknown): TeamMember {
  if (isRecord(data) && (data.data || data.member)) {
    const nested = data.data ?? data.member;
    if (!Array.isArray(nested)) return readMember(nested);
  }
  return readMember(data);
}

function readMembersList(data: unknown): TeamMember[] {
  if (Array.isArray(data)) return data.map(readMember);
  if (isRecord(data) && Array.isArray(data.data)) {
    return data.data.map(readMember);
  }
  throw new Error("Réponse équipe invalide.");
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data } = await api.get<unknown>("/client/team");
  return readMembersList(data);
}

export async function createTeamMember(
  input: CreateTeamMemberInput,
): Promise<TeamMember> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name) throw new Error("Le nom est requis.");
  if (!email) throw new Error("L'email est requis.");
  if (!password.trim()) throw new Error("Le mot de passe est requis.");

  const { data } = await api.post<unknown>("/client/team", {
    name,
    email,
    password,
  });
  return readMemberEntity(data);
}

export async function updateTeamMember(
  id: string,
  input: UpdateTeamMemberInput,
): Promise<TeamMember> {
  const body: UpdateTeamMemberInput = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error("Le nom est requis.");
    body.name = name;
  }

  if (input.email !== undefined) {
    const email = input.email.trim().toLowerCase();
    if (!email) throw new Error("L'email est requis.");
    body.email = email;
  }

  if (input.password !== undefined) {
    const password = input.password;
    if (password.trim()) {
      if (password.length < 6) {
        throw new Error(
          "Le mot de passe doit contenir au moins 6 caractères.",
        );
      }
      body.password = password;
    }
  }

  if (Object.keys(body).length === 0) {
    throw new Error("Aucune modification à enregistrer.");
  }

  const { data } = await api.patch<unknown>(
    `/client/team/${encodeURIComponent(id)}`,
    body,
  );
  return readMemberEntity(data);
}

export async function deleteTeamMember(id: string): Promise<void> {
  await api.delete(`/client/team/${encodeURIComponent(id)}`);
}
