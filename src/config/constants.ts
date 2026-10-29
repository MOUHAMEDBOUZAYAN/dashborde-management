import type { Client } from "@/types";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!rawBaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is missing. Copy .env.example to .env.local.",
  );
}

/** NestJS API origin, without a trailing slash. */
export const API_BASE_URL = rawBaseUrl.replace(/\/$/, "");

/**
 * DEV ONLY — when true, dashboard routes skip login.
 * Never enable in production.
 */
export const AUTH_BYPASS =
  process.env.NEXT_PUBLIC_AUTH_BYPASS === "true";

/** Mock client used while AUTH_BYPASS is on so shell UI still renders. */
export const BYPASS_MOCK_CLIENT: Client = {
  id: "dev-bypass-client",
  company_name: "Client Démo",
  email: "demo@client.com",
};
