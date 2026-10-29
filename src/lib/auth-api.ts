import axios from "axios";
import { api } from "@/lib/api";
import type { Client } from "@/types";

export const clientMeQueryKey = ["client-auth", "me"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readMessage(data: unknown): string | null {
  if (!isRecord(data)) return null;

  const message = data.message;
  if (typeof message === "string" && message.trim()) return message;
  if (Array.isArray(message) && typeof message[0] === "string") {
    return message[0];
  }

  return null;
}

export function readApiMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const message = readMessage(error.response?.data);
  if (message) return message;
  if (error.response?.status === 401) {
    return "Email ou mot de passe incorrect.";
  }
  if (!error.response) return "Impossible de contacter le serveur.";

  return fallback;
}

export function readErrorMessage(error: unknown, fallback: string) {
  const apiMessage = readApiMessage(error, "");
  if (apiMessage) return apiMessage;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function loginWithPassword(email: string, password: string) {
  const { data } = await api.post<unknown>("/client-auth/login", {
    email,
    password,
  });

  return readAccessToken(data);
}

export async function fetchClientMe(): Promise<Client> {
  const { data } = await api.get<unknown>("/client-auth/me");
  return readClientProfile(data);
}

function readAccessToken(data: unknown) {
  if (!isRecord(data)) {
    throw new Error("Réponse de connexion invalide.");
  }

  const token = data.access_token ?? data.accessToken;
  if (typeof token === "string" && token.length > 0) return token;

  throw new Error("Réponse de connexion invalide.");
}

function readClientProfile(data: unknown): Client {
  if (!isRecord(data)) {
    throw new Error("Profil client invalide.");
  }

  const nested = [data.client, data.user, data.data].find(isRecord);
  const source =
    typeof data.company_name === "string" || typeof data.companyName === "string"
      ? data
      : (nested ?? data);

  const id = source.id;
  const email = source.email;
  const companyName = source.company_name ?? source.companyName;

  if (
    (typeof id !== "string" && typeof id !== "number") ||
    typeof email !== "string" ||
    typeof companyName !== "string"
  ) {
    throw new Error("Profil client invalide.");
  }

  return {
    id: String(id),
    email,
    company_name: companyName,
  };
}
