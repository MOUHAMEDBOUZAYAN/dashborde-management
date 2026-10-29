"use client";

import { useSyncExternalStore } from "react";
import { useAuthStore } from "@/store/auth-store";

function subscribe(onStoreChange: () => void) {
  return useAuthStore.persist.onFinishHydration(() => {
    onStoreChange();
  });
}

function getHydratedSnapshot() {
  return useAuthStore.persist.hasHydrated();
}

function getServerHydratedSnapshot() {
  return false;
}

/** False during SSR and the first paint, then true once localStorage is read. */
export function useAuthHydrated() {
  return useSyncExternalStore(
    subscribe,
    getHydratedSnapshot,
    getServerHydratedSnapshot,
  );
}
