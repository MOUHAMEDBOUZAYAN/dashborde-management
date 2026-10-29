"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DevAuthBypassBadge } from "@/components/layout/dev-auth-bypass-badge";
import { StatusScreen } from "@/components/ui/status-screen";
import { AUTH_BYPASS, BYPASS_MOCK_CLIENT } from "@/config/constants";
import { clientMeQueryKey, fetchClientMe } from "@/lib/auth-api";
import { useAuthHydrated } from "@/lib/use-auth-hydrated";
import { useAuthStore } from "@/store/auth-store";

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const client = useAuthStore((state) => state.client);
  const setClient = useAuthStore((state) => state.setClient);

  // Seed mock client so header/sidebar/profile consumers still have data.
  useEffect(() => {
    if (!AUTH_BYPASS) return;
    if (client?.id === BYPASS_MOCK_CLIENT.id) return;
    setClient(BYPASS_MOCK_CLIENT);
  }, [client?.id, setClient]);

  const meQuery = useQuery({
    queryKey: clientMeQueryKey,
    queryFn: fetchClientMe,
    enabled: !AUTH_BYPASS && hydrated && Boolean(token) && !client,
    retry: false,
  });

  useEffect(() => {
    if (AUTH_BYPASS) return;
    if (meQuery.data) {
      setClient(meQuery.data);
    }
  }, [meQuery.data, setClient]);

  useEffect(() => {
    if (AUTH_BYPASS) return;
    if (hydrated && !token) {
      router.replace("/login");
    }
  }, [hydrated, token, router]);

  if (AUTH_BYPASS) {
    return (
      <>
        <DashboardShell>{children}</DashboardShell>
        <DevAuthBypassBadge />
      </>
    );
  }

  if (!hydrated || !token) {
    return <StatusScreen label={hydrated ? "Redirection…" : "Chargement…"} />;
  }

  if (!client && !meQuery.isError) {
    return <StatusScreen label="Chargement…" />;
  }

  if (!client) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-zinc-500">
          Impossible de charger votre profil.
        </p>
        <button
          type="button"
          onClick={() => useAuthStore.getState().logout()}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium"
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
